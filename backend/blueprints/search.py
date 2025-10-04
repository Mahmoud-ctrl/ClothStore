from flask import Blueprint, request, jsonify
from models import db, Product, ProductType, Gender
from sqlalchemy import or_, and_, func

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

# ==================== GLOBAL SEARCH ====================
@search_bp.route('/global', methods=['GET'])
def global_search():
    """
    Global search across all products
    Query params:
    - q: search query (required, min 2 chars)
    - page: page number (default: 1)
    - per_page: results per page (default: 8)
    - sort: newest (default), price_low, price_high, popular
    """
    query_str = request.args.get('q', '').strip()
    
    if not query_str:
        return jsonify({'error': 'Search query is required'}), 400
    
    if len(query_str) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 8, type=int)
    sort = request.args.get('sort', 'newest')
    
    # Build search query (case-insensitive)
    search_pattern = f"%{query_str}%"
    query = Product.query.filter(
        or_(
            Product.title.ilike(search_pattern),
            Product.description.ilike(search_pattern)
        )
    )
    
    # Apply sorting
    if sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'popular':
        query = query.order_by(Product.sales_count.desc())
    else:  # newest (default)
        query = query.order_by(Product.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'query': query_str,
        'results': [{
            'id': p.id,
            'title': p.title,
            'price': str(p.price),
            'original_price': str(p.original_price) if p.original_price else None,
            'images': p.images,
            'in_stock': p.in_stock,
            'is_new': p.is_new,
            'is_sale': p.is_sale,
            'product_type': {
                'id': p.product_type.id,
                'name': p.product_type.name,
                'slug': p.product_type.slug
            },
            'gender': {
                'id': p.product_type.gender.id,
                'name': p.product_type.gender.name,
                'slug': p.product_type.gender.slug
            }
        } for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200


# ==================== CATEGORY/FILTERED SEARCH ====================
@search_bp.route('/products', methods=['GET'])
def filtered_search():
    """
    Advanced product search with filters
    Query params:
    - q: search query (optional)
    - gender: gender slug (e.g., men, women)
    - product_type: product type slug (e.g., men-jeans)
    - on_sale: true/false
    - new_arrivals: true/false
    - sizes: comma-separated (e.g., M,L,XL)
    - colors: comma-separated (e.g., Black,Blue)
    - min_price: minimum price
    - max_price: maximum price
    - in_stock: true/false (default: true)
    - sort: newest (default), price_low, price_high, popular
    - page: page number (default: 1)
    - per_page: results per page (default: 12)
    """
    query = Product.query
    
    # Search query (optional)
    search_str = request.args.get('q', '').strip()
    if search_str and len(search_str) >= 2:
        search_pattern = f"%{search_str}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    
    # Filter by gender
    gender_slug = request.args.get('gender')
    if gender_slug:
        query = query.join(ProductType).join(Gender).filter(
            Gender.slug == gender_slug
        )
    
    # Filter by product type
    product_type_slug = request.args.get('product_type')
    if product_type_slug:
        query = query.join(ProductType).filter(
            ProductType.slug == product_type_slug
        )
    
    # Filter: On Sale
    if request.args.get('on_sale') == 'true':
        query = query.filter(Product.is_sale == True)
    
    # Filter: New Arrivals
    if request.args.get('new_arrivals') == 'true':
        query = query.filter(Product.is_new == True)
    
    # Filter: Sizes
    sizes_param = request.args.get('sizes')
    if sizes_param:
        sizes_list = [s.strip() for s in sizes_param.split(',')]
        # Check if product has ANY of the requested sizes
        size_filters = [Product.sizes.contains([size]) for size in sizes_list]
        query = query.filter(or_(*size_filters))
    
    # Filter: Colors
    colors_param = request.args.get('colors')
    if colors_param:
        colors_list = [c.strip() for c in colors_param.split(',')]
        # Check if product has ANY of the requested colors
        color_filters = [Product.colors.contains([color]) for color in colors_list]
        query = query.filter(or_(*color_filters))
    
    # Filter: Price range
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Filter: In stock (default: true)
    in_stock = request.args.get('in_stock', 'true')
    if in_stock == 'true':
        query = query.filter(Product.in_stock == True)
    
    # Sorting
    sort = request.args.get('sort', 'newest')
    if sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'popular':
        query = query.order_by(Product.sales_count.desc())
    else:  # newest (default)
        query = query.order_by(Product.created_at.desc())
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'products': [{
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'price': str(p.price),
            'original_price': str(p.original_price) if p.original_price else None,
            'images': p.images,
            'sizes': p.sizes,
            'colors': p.colors,
            'in_stock': p.in_stock,
            'is_new': p.is_new,
            'is_sale': p.is_sale,
            'sales_count': p.sales_count,
            'product_type': {
                'id': p.product_type.id,
                'name': p.product_type.name,
                'slug': p.product_type.slug
            },
            'gender': {
                'id': p.product_type.gender.id,
                'name': p.product_type.gender.name,
                'slug': p.product_type.gender.slug
            }
        } for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'filters_applied': {
            'search': search_str if search_str else None,
            'gender': gender_slug,
            'product_type': product_type_slug,
            'on_sale': request.args.get('on_sale') == 'true',
            'new_arrivals': request.args.get('new_arrivals') == 'true',
            'sizes': sizes_list if sizes_param else [],
            'colors': colors_list if colors_param else [],
            'min_price': min_price,
            'max_price': max_price,
            'in_stock': in_stock == 'true',
            'sort': sort
        }
    }), 200


# ==================== GET FILTER OPTIONS ====================
@search_bp.route('/filters', methods=['GET'])
def get_filter_options():
    """
    Get available filter options (sizes, colors) for the sidebar
    Query params:
    - gender: filter options for specific gender
    - product_type: filter options for specific product type
    """
    query = Product.query
    
    # Filter by gender if provided
    gender_slug = request.args.get('gender')
    if gender_slug:
        query = query.join(ProductType).join(Gender).filter(
            Gender.slug == gender_slug
        )
    
    # Filter by product type if provided
    product_type_slug = request.args.get('product_type')
    if product_type_slug:
        query = query.join(ProductType).filter(
            ProductType.slug == product_type_slug
        )
    
    products = query.all()
    
    # Collect all unique sizes and colors
    all_sizes = set()
    all_colors = set()
    
    for p in products:
        if p.sizes:
            all_sizes.update(p.sizes)
        if p.colors:
            all_colors.update(p.colors)
    
    # Get price range
    price_query = query.with_entities(
        func.min(Product.price).label('min_price'),
        func.max(Product.price).label('max_price')
    ).first()
    
    return jsonify({
        'sizes': sorted(list(all_sizes)),
        'colors': sorted(list(all_colors)),
        'price_range': {
            'min': float(price_query.min_price) if price_query.min_price else 0,
            'max': float(price_query.max_price) if price_query.max_price else 0
        }
    }), 200