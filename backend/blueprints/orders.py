from flask import Blueprint, jsonify, request
from models import db, Order, OrderItem, Product
from sqlalchemy import func
from datetime import datetime
import secrets
import string

order_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


def generate_order_number():
    """Generate a unique, recognizable order number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"ORD-{timestamp}-{random_str}"


@order_bp.route('/', methods=['POST'])
def create_order():
    """
    [CUSTOMER] Create a new order from a shopping cart payload.
    This is the core checkout endpoint.
    Expected JSON:
    {
        "customer_name": "John Doe",
        "customer_phone": "+1234567890",
        "address_line1": "123 Main St",
        "city": "New York",
        "latitude": 33.271151,  // Optional: GPS coordinates
        "longitude": 35.203847, // Optional: GPS coordinates
        "items": [
            {
                "product_id": 1,
                "quantity": 2,
                "size": "M",
                "color": "Blue"
            }
        ]
    }
    """
    data = request.get_json()
    
    # 1. Validate required fields
    required_fields = ['customer_name', 'customer_phone', 'address_line1', 'city', 'items']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    if not data['items'] or len(data['items']) == 0:
        return jsonify({
            'success': False,
            'error': 'Order must contain at least one item'
        }), 400
    
    try:
        # 2. Calculate totals and validate products
        subtotal = 0.0
        order_items_data = []
        
        for item in data['items']:
            product = Product.query.get(item.get('product_id'))
            
            if not product:
                return jsonify({
                    'success': False,
                    'error': f'Product with ID {item.get("product_id")} not found'
                }), 404
            
            if not product.in_stock:
                return jsonify({
                    'success': False,
                    'error': f'Product "{product.title}" is out of stock'
                }), 400
            
            quantity = item.get('quantity', 1)
            if not isinstance(quantity, int) or quantity <= 0:
                 return jsonify({
                    'success': False,
                    'error': f'Invalid quantity for product {product.id}'
                }), 400

            item_price = float(product.price)
            item_subtotal = item_price * quantity
            subtotal += item_subtotal
            
            order_items_data.append({
                'product': product,
                'quantity': quantity,
                'size': item.get('size'),
                'color': item.get('color'),
                'price': item_price,
                'subtotal': item_subtotal
            })
        
        # 3. Calculate shipping (e.g., free shipping over $100)
        shipping_cost = 0.00 if subtotal >= 100.00 else 10.00
        total = subtotal + shipping_cost
        
        # 4. Extract GPS coordinates (optional)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Validate coordinates if provided
        if latitude is not None:
            try:
                latitude = float(latitude)
                if not (-90 <= latitude <= 90):
                    latitude = None
            except (ValueError, TypeError):
                latitude = None
        
        if longitude is not None:
            try:
                longitude = float(longitude)
                if not (-180 <= longitude <= 180):
                    longitude = None
            except (ValueError, TypeError):
                longitude = None
        
        # 5. Create Order header
        order = Order(
            order_number=generate_order_number(),
            customer_name=data['customer_name'],
            customer_phone=data['customer_phone'],
            address_line1=data['address_line1'],
            city=data['city'],
            latitude=latitude,
            longitude=longitude,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            status='pending', # Initial status for customer orders
            payment_status='pending' # Assume payment integration happens next
        )
        
        db.session.add(order)
        db.session.flush() # Get order ID before adding items
        
        # 6. Create Order Items and update Product sales count
        for item_data in order_items_data:
            # IMPORTANT: Increment the product's sales counter
            item_data['product'].sales_count += item_data['quantity']
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product'].id,
                product_title=item_data['product'].title,
                # Safely get the first image or None
                product_image=item_data['product'].images[0] if item_data['product'].images and len(item_data['product'].images) > 0 else None,
                price=item_data['price'],
                size=item_data['size'],
                color=item_data['color'],
                quantity=item_data['quantity'],
                subtotal=item_data['subtotal']
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully. Proceed to payment.',
            'order': format_order(order, detailed=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Log the error for debugging purposes
        print(f"Error creating order: {e}")
        return jsonify({
            'success': False,
            'error': 'An internal error occurred during order creation.'
        }), 500


@order_bp.route('/<int:order_id>', methods=['GET'])
def get_order_by_id(order_id):
    """
    [CUSTOMER] Get single order by ID with full details.
    (Used internally by the user's account page)
    """
    # NOTE: In a real app, this should also filter by user ID for security.
    order = Order.query.get_or_404(order_id)
    
    return jsonify({
        'success': True,
        'order': format_order(order, detailed=True)
    })


@order_bp.route('/number/<order_number>', methods=['GET'])
def get_order_by_number(order_number):
    """
    [CUSTOMER] Get order by unique order number.
    (Used for public order tracking lookup)
    """
    order = Order.query.filter_by(order_number=order_number).first_or_404()
    
    return jsonify({
        'success': True,
        'order': format_order(order, detailed=True)
    })


# ============ HELPER FUNCTIONS ============

def format_order(order, detailed=False):
    """Format order data for JSON response"""
    base_data = {
        'id': order.id,
        'order_number': order.order_number,
        'customer_name': order.customer_name,
        'customer_phone': order.customer_phone,
        'address_line1': order.address_line1,
        'city': order.city,
        'latitude': float(order.latitude) if order.latitude is not None else None,
        'longitude': float(order.longitude) if order.longitude is not None else None,
        'subtotal': float(order.subtotal),
        'shipping_cost': float(order.shipping_cost),
        'total': float(order.total),
        'status': order.status,
        'payment_status': order.payment_status,
        'created_at': order.created_at.isoformat() if order.created_at else None,
        'item_count': order.item_count
    }
    
    if detailed:
        base_data.update({
            'updated_at': order.updated_at.isoformat() if order.updated_at else None,
            'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
            'items': [format_order_item(item) for item in order.order_items]
        })
    
    return base_data


def format_order_item(item):
    """Format order item data for JSON response"""
    return {
        'id': item.id,
        'product_id': item.product_id,
        'product_title': item.product_title,
        'product_image': item.product_image,
        'price': float(item.price),
        'size': item.size,
        'color': item.color,
        'quantity': item.quantity,
        'subtotal': float(item.subtotal)
    }


# ============ UTILITY FUNCTIONS FOR ADMIN USE ============

def generate_google_maps_link(latitude, longitude):
    """
    Generate Google Maps link from coordinates.
    This helper can be used in your admin blueprint later.
    """
    if latitude and longitude:
        return f"https://www.google.com/maps?q={latitude},{longitude}"
    return None


def generate_waze_link(latitude, longitude):
    """
    Generate Waze navigation link from coordinates.
    Popular in Middle East for delivery navigation.
    """
    if latitude and longitude:
        return f"https://waze.com/ul?ll={latitude},{longitude}&navigate=yes"
    return None


def get_delivery_info(order):
    """
    Get formatted delivery information with map links.
    Use this in your admin blueprint to send to drivers.
    
    Example usage in admin blueprint:
    delivery_info = get_delivery_info(order)
    # Then send via WhatsApp/SMS to driver
    """
    if not order:
        return None
    
    info = {
        'order_number': order.order_number,
        'customer_name': order.customer_name,
        'customer_phone': order.customer_phone,
        'address': f"{order.address_line1}, {order.city}",
        'has_gps': order.latitude is not None and order.longitude is not None
    }
    
    if info['has_gps']:
        info['google_maps'] = generate_google_maps_link(order.latitude, order.longitude)
        info['waze'] = generate_waze_link(order.latitude, order.longitude)
        info['coordinates'] = f"{order.latitude},{order.longitude}"
    else:
        # Fallback to address search
        address_encoded = f"{order.address_line1}, {order.city}".replace(' ', '+')
        info['google_maps'] = f"https://www.google.com/maps/search/?api=1&query={address_encoded}"
    
    return info