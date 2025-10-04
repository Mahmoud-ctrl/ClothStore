from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Order, OrderItem, Product
from sqlalchemy import desc, or_, func
from datetime import datetime

admin_orders_bp = Blueprint('admin_orders', __name__, url_prefix='/api/admin/orders')

# ==================== ORDERS LIST & STATS ====================
@admin_orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Order.query
    
    # Apply filters
    if request.args.get('status'):
        query = query.filter_by(status=request.args.get('status'))
    
    if request.args.get('payment_status'):
        query = query.filter_by(payment_status=request.args.get('payment_status'))
    
    if request.args.get('search'):
        search_term = f'%{request.args.get("search")}%'
        query = query.filter(
            or_(
                Order.order_number.ilike(search_term),
                Order.customer_name.ilike(search_term),
                Order.customer_phone.ilike(search_term),
                Order.city.ilike(search_term)
            )
        )
    
    # Order by newest first
    pagination = query.order_by(desc(Order.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'orders': [{
            'id': o.id,
            'order_number': o.order_number,
            'customer_name': o.customer_name,
            'customer_phone': o.customer_phone,
            'city': o.city,
            'total': str(o.total),
            'status': o.status,
            'payment_status': o.payment_status,
            'item_count': o.item_count,
            'created_at': o.created_at.isoformat() if o.created_at else None,
            'delivered_at': o.delivered_at.isoformat() if o.delivered_at else None
        } for o in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@admin_orders_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_order_stats():
    """Get order statistics for dashboard"""
    # Status counts
    status_counts = db.session.query(
        Order.status, 
        func.count(Order.id)
    ).group_by(Order.status).all()
    
    # Payment status counts
    payment_counts = db.session.query(
        Order.payment_status,
        func.count(Order.id)
    ).group_by(Order.payment_status).all()
    
    # Total revenue
    total_revenue = db.session.query(
        func.sum(Order.total)
    ).filter(Order.payment_status == 'paid').scalar() or 0
    
    # Recent orders count (last 24 hours)
    from datetime import timedelta
    yesterday = datetime.now() - timedelta(days=1)
    recent_orders = Order.query.filter(Order.created_at >= yesterday).count()
    
    return jsonify({
        'status_counts': dict(status_counts),
        'payment_counts': dict(payment_counts),
        'total_revenue': str(total_revenue),
        'recent_orders_24h': recent_orders,
        'total_orders': Order.query.count()
    }), 200

# ==================== ORDER DETAILS ====================
@admin_orders_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_order(id):
    """Get detailed order information"""
    order = Order.query.get_or_404(id)
    
    return jsonify({
        'id': order.id,
        'order_number': order.order_number,
        'customer_name': order.customer_name,
        'customer_phone': order.customer_phone,
        'address_line1': order.address_line1,
        'city': order.city,
        'latitude': order.latitude,
        'longitude': order.longitude,
        'subtotal': str(order.subtotal),
        'shipping_cost': str(order.shipping_cost),
        'total': str(order.total),
        'status': order.status,
        'payment_status': order.payment_status,
        'created_at': order.created_at.isoformat() if order.created_at else None,
        'updated_at': order.updated_at.isoformat() if order.updated_at else None,
        'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
        'items': [{
            'id': item.id,
            'product_id': item.product_id,
            'product_title': item.product_title,
            'product_image': item.product_image,
            'price': str(item.price),
            'size': item.size,
            'color': item.color,
            'quantity': item.quantity,
            'subtotal': str(item.subtotal)
        } for item in order.order_items]
    }), 200

# ==================== UPDATE ORDER STATUS ====================
@admin_orders_bp.route('/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(id):
    """Update order status"""
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    if not data.get('status'):
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    new_status = data['status']
    
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    order.status = new_status
    
    # Auto-set delivered timestamp
    if new_status == 'delivered' and not order.delivered_at:
        order.delivered_at = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Status updated',
        'status': order.status,
        'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None
    }), 200

@admin_orders_bp.route('/<int:id>/payment-status', methods=['PUT'])
@jwt_required()
def update_payment_status(id):
    """Update payment status"""
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    if not data.get('payment_status'):
        return jsonify({'error': 'Payment status is required'}), 400
    
    valid_payment_statuses = ['pending', 'paid', 'failed', 'refunded']
    new_payment_status = data['payment_status']
    
    if new_payment_status not in valid_payment_statuses:
        return jsonify({'error': 'Invalid payment status'}), 400
    
    order.payment_status = new_payment_status
    db.session.commit()
    
    return jsonify({
        'message': 'Payment status updated',
        'payment_status': order.payment_status
    }), 200

# ==================== UPDATE ORDER INFO ====================
@admin_orders_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_order(id):
    """Update order information (address, customer info, etc.)"""
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    # Only allow updating certain fields
    updatable_fields = [
        'customer_name', 'customer_phone', 'address_line1', 
        'city', 'latitude', 'longitude', 'shipping_cost'
    ]
    
    for field in updatable_fields:
        if field in data:
            setattr(order, field, data[field])
    
    # Recalculate total if shipping cost changed
    if 'shipping_cost' in data:
        order.total = order.subtotal + data['shipping_cost']
    
    db.session.commit()
    
    return jsonify({'message': 'Order updated'}), 200

# ==================== DELETE ORDER ====================
@admin_orders_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_order(id):
    """Delete an order (use with caution)"""
    order = Order.query.get_or_404(id)
    
    # Prevent deletion of delivered or paid orders
    if order.status == 'delivered':
        return jsonify({'error': 'Cannot delete delivered orders'}), 400
    
    if order.payment_status == 'paid':
        return jsonify({'error': 'Cannot delete paid orders. Refund first.'}), 400
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Order deleted'}), 200

# ==================== BULK OPERATIONS ====================
@admin_orders_bp.route('/bulk-status', methods=['PUT'])
@jwt_required()
def bulk_update_status():
    """Update status for multiple orders"""
    data = request.get_json()
    
    if not data.get('order_ids') or not data.get('status'):
        return jsonify({'error': 'order_ids and status are required'}), 400
    
    valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    order_ids = data['order_ids']
    orders = Order.query.filter(Order.id.in_(order_ids)).all()
    
    updated_count = 0
    for order in orders:
        order.status = data['status']
        if data['status'] == 'delivered' and not order.delivered_at:
            order.delivered_at = datetime.now()
        updated_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'{updated_count} orders updated',
        'updated_count': updated_count
    }), 200