from flask import Blueprint, jsonify, request
from models import db, Product, Gender, ProductType
from sqlalchemy import func, and_, or_

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

@product_bp.route('/', methods=['GET'])
def get_all_products():
    """Get all products with optional filtering"""
    # Query parameters
    gender_slug = request.args.get('gender_slug')
    product_type_slug = request.args.get('product_type_slug')
    is_new = request.args.get('is_new', type=bool)
    is_sale = request.args.get('is_sale', type=bool)
    sort_by = request.args.get('sort_by', 'created_at')
    order = request.args.get('order', 'desc')
    
    # New filter parameters
    sizes = request.args.get('sizes')  # Comma-separated: "S,M,L"
    colors = request.args.get('colors')  # Comma-separated: "black,blue,red"
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Product.query.join(ProductType).join(Gender)
    
    # Apply filters
    if gender_slug:
        query = query.filter(func.lower(Gender.slug) == gender_slug.lower())
    
    if product_type_slug:
        query = query.filter(func.lower(ProductType.slug) == product_type_slug.lower())
    
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)
    
    if is_sale is not None:
        query = query.filter(Product.is_sale == is_sale)
    
    # Size filter
    if sizes:
        size_list = [s.strip() for s in sizes.split(',')]
        query = query.filter(Product.sizes.op('&&')(size_list))

    # Color filter  
    if colors:
        color_list = [c.strip().lower() for c in colors.split(',')]
        query = query.filter(Product.colors.op('&&')(color_list))
    
    # Price range filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Apply sorting
    if sort_by == 'price':
        query = query.order_by(Product.price.desc() if order == 'desc' else Product.price.asc())
    elif sort_by == 'name':
        query = query.order_by(Product.title.desc() if order == 'desc' else Product.title.asc())
    else:  # created_at
        query = query.order_by(Product.created_at.desc() if order == 'desc' else Product.created_at.asc())
    
    products = query.all()
    
    return jsonify({
        'success': True,
        'count': len(products),
        'products': [format_product(p) for p in products]
    })


@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get single product by ID"""
    product = Product.query.get_or_404(product_id)
    
    return jsonify({
        'success': True,
        'product': format_product(product, detailed=True)
    })


@product_bp.route('/gender/<gender_slug>', methods=['GET'])
def get_products_by_gender(gender_slug):
    """
    Get all products for a top-level Gender (e.g., /api/products/gender/men)
    """
    product_type_slug = request.args.get('product_type_slug')
    is_new = request.args.get('is_new', type=bool)
    is_sale = request.args.get('is_sale', type=bool)
    sort_by = request.args.get('sort_by', 'created_at')
    order = request.args.get('order', 'desc')
    
    # New filter parameters
    sizes = request.args.get('sizes')
    colors = request.args.get('colors')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Product.query.join(ProductType).join(Gender)
    
    # Filter by Gender (main filter)
    query = query.filter(func.lower(Gender.slug) == gender_slug.lower())
    
    # Optional filter: filter by a ProductType within this Gender
    if product_type_slug:
        query = query.filter(func.lower(ProductType.slug) == product_type_slug.lower())
    
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)
    
    if is_sale is not None:
        query = query.filter(Product.is_sale == is_sale)
    
    # Size filter
    if sizes:
        size_list = [s.strip() for s in sizes.split(',')]
        query = query.filter(Product.sizes.op('&&')(size_list))

    # Color filter  
    if colors:
        color_list = [c.strip().lower() for c in colors.split(',')]
        query = query.filter(Product.colors.op('&&')(color_list))
    
    # Price range filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Sorting
    if sort_by == 'price':
        query = query.order_by(Product.price.desc() if order == 'desc' else Product.price.asc())
    elif sort_by == 'name':
        query = query.order_by(Product.title.desc() if order == 'desc' else Product.title.asc())
    else:
        query = query.order_by(Product.created_at.desc() if order == 'desc' else Product.created_at.asc())
    
    products = query.all()
    
    return jsonify({
        'success': True,
        'gender': gender_slug,
        'count': len(products),
        'products': [format_product(p) for p in products]
    })


@product_bp.route('/product-type/<product_type_slug>', methods=['GET'])
def get_products_by_product_type(product_type_slug):
    """
    Get products by specific Product Type slug
    (e.g., /api/products/product-type/t-shirts)
    """
    is_new = request.args.get('is_new', type=bool)
    is_sale = request.args.get('is_sale', type=bool)
    sort_by = request.args.get('sort_by', 'created_at')
    order = request.args.get('order', 'desc')
    
    # New filter parameters
    sizes = request.args.get('sizes')
    colors = request.args.get('colors')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Product.query.join(ProductType)
    query = query.filter(ProductType.slug == product_type_slug)
    
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)
    
    if is_sale is not None:
        query = query.filter(Product.is_sale == is_sale)
    
    # Size filter
    if sizes:
        size_list = [s.strip() for s in sizes.split(',')]
        query = query.filter(Product.sizes.op('&&')(size_list))

    # Color filter  
    if colors:
        color_list = [c.strip().lower() for c in colors.split(',')]
        query = query.filter(Product.colors.op('&&')(color_list))
    
    # Price range filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Sorting
    if sort_by == 'price':
        query = query.order_by(Product.price.desc() if order == 'desc' else Product.price.asc())
    elif sort_by == 'name':
        query = query.order_by(Product.title.desc() if order == 'desc' else Product.title.asc())
    else:
        query = query.order_by(Product.created_at.desc() if order == 'desc' else Product.created_at.asc())
    
    products = query.all()
    
    return jsonify({
        'success': True,
        'product_type_slug': product_type_slug,
        'count': len(products),
        'products': [format_product(p) for p in products]
    })


# ============ NEW ENDPOINT: Get Available Filter Options ============

@product_bp.route('/filters', methods=['GET'])
def get_filter_options():
    """
    Get available filter options (sizes, colors, price range) for current context
    Useful for dynamically populating filter UI
    """
    gender_slug = request.args.get('gender_slug')
    product_type_slug = request.args.get('product_type_slug')
    
    query = Product.query.join(ProductType).join(Gender)
    
    if gender_slug:
        query = query.filter(func.lower(Gender.slug) == gender_slug.lower())
    
    if product_type_slug:
        query = query.filter(func.lower(ProductType.slug) == product_type_slug.lower())
    
    products = query.all()
    
    # Extract unique sizes and colors
    all_sizes = set()
    all_colors = set()
    prices = []
    
    for product in products:
        if product.sizes:
            all_sizes.update(product.sizes)
        if product.colors:
            all_colors.update([c.lower() for c in product.colors])
        prices.append(float(product.price))
    
    return jsonify({
        'success': True,
        'sizes': sorted(list(all_sizes)),
        'colors': sorted(list(all_colors)),
        'price_range': {
            'min': min(prices) if prices else 0,
            'max': max(prices) if prices else 1000
        }
    })


# ============ HELPER FUNCTIONS ============

def format_product(product, detailed=False):
    """Format product data for JSON response"""
    base_data = {
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'price': float(product.price),
        'original_price': float(product.original_price) if product.original_price else None,
        'images': product.images,
        'in_stock': product.in_stock,
        'is_new': product.is_new,
        'is_sale': product.is_sale,
        'sizes': product.sizes,
        'colors': product.colors,
        'product_type': {
            'id': product.product_type.id,
            'name': product.product_type.name,
            'slug': product.product_type.slug,
            'gender': {
                'id': product.product_type.gender.id,
                'name': product.product_type.gender.name,
                'slug': product.product_type.gender.slug
            }
        }
    }
    
    if detailed:
        base_data.update({
            'review_count': product.review_count,
            'sales_count': product.sales_count,
            'created_at': product.created_at.isoformat() if product.created_at else None
        })
    
    return base_data