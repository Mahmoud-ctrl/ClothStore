from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Gender, ProductType, Product
from sqlalchemy import desc

crud_bp = Blueprint('crud', __name__, url_prefix='/api/admin')

# ==================== GENDERS (TOP LEVEL: Men, Women) ====================
@crud_bp.route('/genders', methods=['GET'])
@jwt_required()
def get_genders():
    """Get all top-level genders (Men, Women)"""
    genders = Gender.query.all()
    return jsonify([{
        'id': g.id,
        'name': g.name,
        'slug': g.slug,
        'product_types_count': len(g.product_types)
    } for g in genders]), 200

@crud_bp.route('/genders/<int:id>', methods=['GET'])
@jwt_required()
def get_gender(id):
    """Get a single top-level gender and its product types"""
    g = Gender.query.get_or_404(id)
    return jsonify({
        'id': g.id,
        'name': g.name,
        'slug': g.slug,
        'product_types': [{
            'id': pt.id,
            'name': pt.name,
            'slug': pt.slug
        } for pt in g.product_types]
    }), 200

@crud_bp.route('/genders', methods=['POST'])
@jwt_required()
def create_gender():
    """Create a new top-level Gender (e.g., Kids)"""
    data = request.get_json()
    
    if not data.get('name') or not data.get('slug'):
        return jsonify({'error': 'Name and slug are required'}), 400
    
    if Gender.query.filter_by(slug=data['slug']).first():
        return jsonify({'error': 'Top level gender already exists'}), 400
    
    gender = Gender(name=data['name'], slug=data['slug'])
    db.session.add(gender)
    db.session.commit()
    
    return jsonify({'message': 'Created', 'id': gender.id}), 201

@crud_bp.route('/genders/<int:id>', methods=['PUT'])
@jwt_required()
def update_gender(id):
    """Update a top-level Gender"""
    gender = Gender.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        gender.name = data['name']
    if 'slug' in data:
        existing = Gender.query.filter_by(slug=data['slug']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Top level gender already exists'}), 400
        gender.slug = data['slug']
    
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@crud_bp.route('/genders/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_gender(id):
    """Delete a top-level Gender"""
    gender = Gender.query.get_or_404(id)
    
    if gender.product_types:
        return jsonify({'error': 'Has product types'}), 400
    
    db.session.delete(gender)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ==================== PRODUCT TYPES (SECOND LEVEL: T-Shirts, Jeans) ====================
@crud_bp.route('/product-types', methods=['GET'])
@jwt_required()
def get_product_types():
    """Get all Product Types (T-Shirt, Jeans)"""
    types = ProductType.query.all()
    return jsonify([{
        'id': pt.id,
        'name': pt.name,
        'slug': pt.slug,
        'gender': {'id': pt.gender.id, 'name': pt.gender.name},
        'products_count': len(pt.products)
    } for pt in types]), 200

@crud_bp.route('/product-types/<int:id>', methods=['GET'])
@jwt_required()
def get_product_type(id):
    """Get a single Product Type"""
    pt = ProductType.query.get_or_404(id)
    return jsonify({
        'id': pt.id,
        'name': pt.name,
        'slug': pt.slug,
        'gender_id': pt.gender_id,
        'gender': {'id': pt.gender.id, 'name': pt.gender.name}
    }), 200

@crud_bp.route('/product-types', methods=['POST'])
@jwt_required()
def create_product_type():
    """Create a new Product Type"""
    data = request.get_json()
    
    if not all(data.get(f) for f in ['name', 'gender_id']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    gender = Gender.query.get(data['gender_id'])
    if not gender:
        return jsonify({'error': 'Gender not found'}), 404
    
    # Check if this product type name already exists for this gender
    existing = ProductType.query.filter_by(
        name=data['name'],
        gender_id=data['gender_id']
    ).first()
    
    if existing:
        return jsonify({'error': f'Product type "{data["name"]}" already exists for this gender'}), 400
    
    # Generate slug: combine gender slug with product type name
    # e.g., "women-jeans", "men-jeans"
    slug = data.get('slug')
    if slug:
        # If slug is provided, check if it already exists
        if ProductType.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Slug already exists'}), 400
    else:
        # Auto-generate slug from gender + name
        base_name = data['name'].lower().replace(' ', '-')
        slug = f"{gender.slug}-{base_name}"
        
        # If auto-generated slug exists, it means we have a duplicate name in this gender
        # which should have been caught by the earlier check, but just in case
        if ProductType.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Slug already exists'}), 400
    
    product_type = ProductType(
        name=data['name'],
        slug=slug,
        gender_id=data['gender_id']
    )
    db.session.add(product_type)
    db.session.commit()
    
    return jsonify({'message': 'Created', 'id': product_type.id}), 201

@crud_bp.route('/product-types/<int:id>', methods=['PUT'])
@jwt_required()
def update_product_type(id):
    """Update a Product Type"""
    product_type = ProductType.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        # Check if new name conflicts with existing product type in same gender
        existing = ProductType.query.filter_by(
            name=data['name'],
            gender_id=product_type.gender_id
        ).first()
        
        if existing and existing.id != id:
            return jsonify({'error': f'Product type "{data["name"]}" already exists for this gender'}), 400
        
        product_type.name = data['name']
        
        # Auto-update slug if name changes (unless slug is explicitly provided)
        if 'slug' not in data:
            product_type.slug = f"{product_type.gender.slug}-{data['name'].lower().replace(' ', '-')}"
    
    if 'slug' in data:
        # Check if new slug conflicts with existing slug
        existing = ProductType.query.filter_by(slug=data['slug']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Slug already exists'}), 400
        product_type.slug = data['slug']
    
    if 'gender_id' in data:
        gender = Gender.query.get(data['gender_id'])
        if not gender:
            return jsonify({'error': 'Gender not found'}), 404
        
        # Check if moving to new gender would create name conflict
        existing = ProductType.query.filter_by(
            name=product_type.name,
            gender_id=data['gender_id']
        ).first()
        
        if existing and existing.id != id:
            return jsonify({'error': f'Product type "{product_type.name}" already exists for target gender'}), 400
        
        product_type.gender_id = data['gender_id']
        
        # Auto-update slug when gender changes
        if 'slug' not in data:
            product_type.slug = f"{gender.slug}-{product_type.name.lower().replace(' ', '-')}"
    
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@crud_bp.route('/product-types/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product_type(id):
    """Delete a Product Type"""
    product_type = ProductType.query.get_or_404(id)
    
    if product_type.products:
        return jsonify({'error': 'Has products'}), 400
    
    db.session.delete(product_type)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ==================== PRODUCTS ====================
@crud_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    """Get all products with pagination and filters"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Product.query
    
    if request.args.get('product_type_id'):
        query = query.filter_by(product_type_id=request.args.get('product_type_id'))
    if request.args.get('in_stock') is not None:
        query = query.filter_by(in_stock=request.args.get('in_stock').lower() == 'true')
    if request.args.get('is_sale') is not None:
        query = query.filter_by(is_sale=request.args.get('is_sale').lower() == 'true')
    
    pagination = query.order_by(desc(Product.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'products': [{
            'id': p.id,
            'title': p.title,
            'price': str(p.price),
            'original_price': str(p.original_price) if p.original_price else None,
            'in_stock': p.in_stock,
            'is_new': p.is_new,
            'is_sale': p.is_sale,
            'sales_count': p.sales_count,
            'images': p.images,
            'product_type': {'id': p.product_type.id, 'name': p.product_type.name}
        } for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@crud_bp.route('/products/<int:id>', methods=['GET'])
@jwt_required()
def get_product(id):
    """Get a single product"""
    p = Product.query.get_or_404(id)
    return jsonify({
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
        'review_count': p.review_count,
        'product_type_id': p.product_type_id,
        'created_at': p.created_at.isoformat() if p.created_at else None
    }), 200

@crud_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product"""
    data = request.get_json()
    
    if not all(data.get(f) for f in ['title', 'price', 'product_type_id']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not ProductType.query.get(data['product_type_id']):
        return jsonify({'error': 'Product type not found'}), 404
    
    if Product.query.filter_by(title=data['title']).first():
        return jsonify({'error': 'Title already exists'}), 400
    
    product = Product(
        title=data['title'],
        description=data.get('description'),
        price=data['price'],
        original_price=data.get('original_price'),
        images=data.get('images', []),
        sizes=data.get('sizes', []),
        colors=data.get('colors', []),
        in_stock=data.get('in_stock', True),
        is_new=data.get('is_new', False),
        is_sale=data.get('is_sale', False),
        product_type_id=data['product_type_id']
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({'message': 'Created', 'id': product.id}), 201

@crud_bp.route('/products/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    """Update an existing product"""
    product = Product.query.get_or_404(id)
    data = request.get_json()
    
    fields = ['title', 'description', 'price', 'original_price', 'images', 
              'sizes', 'colors', 'in_stock', 'is_new', 'is_sale']
    
    for field in fields:
        if field in data:
            setattr(product, field, data[field])
    
    if 'product_type_id' in data:
        if not ProductType.query.get(data['product_type_id']):
            return jsonify({'error': 'Product type not found'}), 404
        product.product_type_id = data['product_type_id']
    
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@crud_bp.route('/products/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    """Delete a product"""
    product = Product.query.get_or_404(id)
    
    if product.order_items:
        return jsonify({'error': 'Has existing orders'}), 400
    
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200