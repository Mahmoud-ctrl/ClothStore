from flask import Blueprint, jsonify, request
from models import db, Product, Gender, ProductType
from sqlalchemy import func

category_bp = Blueprint('categories', __name__, url_prefix='/api/categories')

@category_bp.route('/', methods=['GET'])
def get_all_categories():
    """Get all genders with their product types"""
    genders = Gender.query.all() # Gender is the top level now
    
    result = []
    for gender in genders:
        result.append({
            'id': gender.id,
            'name': gender.name,
            'slug': gender.slug,
            'product_types': [ # Relationship name change
                {
                    'id': pt.id,
                    'name': pt.name,
                    'slug': pt.slug,
                    'product_count': len(pt.products)
                }
                for pt in gender.product_types # Relationship name change
            ]
        })
    
    return jsonify({
        'success': True,
        'categories': result
    })


@category_bp.route('/genders', methods=['GET'])
def get_genders_list():
    """Get all top-level genders (Men, Women, etc.)"""
    genders = Gender.query.all()
    
    return jsonify({
        'success': True,
        'genders': [
            {
                'id': g.id,
                'name': g.name,
                'slug': g.slug,
                # Sum products across all associated ProductTypes
                'total_products': sum(len(pt.products) for pt in g.product_types) 
            }
            for g in genders
        ]
    })


@category_bp.route('/product-types', methods=['GET'])
def get_product_types():
    """Get all product types (T-Shirt, Jeans) with product counts"""
    # Filter by gender slug (e.g., /product-types?gender_slug=men)
    gender_slug = request.args.get('gender_slug') 
    
    query = ProductType.query.join(Gender)
    
    if gender_slug:
        # Filter ProductType by its associated Gender's slug
        query = query.filter(func.lower(Gender.slug) == gender_slug.lower()) 
    
    categories = query.all()
    
    return jsonify({
        'success': True,
        'product_types': [ # Variable name change
            {
                'id': pt.id,
                'name': pt.name,
                'slug': pt.slug,
                'gender': { # Relationship name change
                    'id': pt.gender.id,
                    'name': pt.gender.name,
                    'slug': pt.gender.slug
                },
                'product_count': len(pt.products)
            }
            for pt in categories # Variable name change
        ]
    })


@category_bp.route('/unique-genders', methods=['GET'])
def get_unique_genders():
    """
    Get unique top-level genders (Men, Women, Kids, Unisex) with total product counts.
    Note: The new schema structure makes this query simpler.
    """
    # Query: Gender (Men) -> ProductType (T-shirt) -> Product
    genders = db.session.query(
        Gender.name,
        Gender.slug,
        func.count(Product.id).label('product_count')
    ).join(ProductType).join(Product).group_by(Gender.name, Gender.slug).all()
    
    return jsonify({
        'success': True,
        'genders': [
            {
                'name': g.name,
                'slug': g.slug,
                'product_count': g.product_count
            }
            for g in genders
        ]
    })