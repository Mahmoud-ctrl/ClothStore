from flask import Flask, abort, request, redirect, url_for, jsonify
from sqlalchemy import func
from config import Config
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from models import db
from flask_cors import CORS
import pytz
from flask_jwt_extended import JWTManager
from blueprints.admin_auth import auth_bp
from blueprints.admin_crud import crud_bp
from blueprints.admin_orders import admin_orders_bp
from blueprints.products import product_bp
from blueprints.category import category_bp
from blueprints.orders import order_bp
from blueprints.search import search_bp
from blueprints.admin_dashboard import dashboard_bp

app = Flask(__name__)

# Configuration
app.config.from_object(Config)
app.config['SECRET_KEY'] = '1289'
app.config['JWT_SECRET_KEY'] = '1289'
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)

# Initialize extensions
jwt = JWTManager(app)
db.init_app(app)
lebanon_tz = pytz.timezone("Asia/Beirut")

# CORS Configuration - MUST be after app creation but before routes
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:8080",
                "http://192.168.0.110:8080",
                "https://fashionhub12.netlify.app"
            ],
            "allow_headers": ["Authorization", "Content-Type", "X-CSRF-TOKEN"],
            "expose_headers": ["Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "supports_credentials": True
        },
    }
)

# Handle preflight requests BEFORE JWT checks
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-CSRF-TOKEN'
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response

# JWT Error handlers - Return JSON, never redirect
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    print(f"JWT Error: {callback}")
    return jsonify({'error': 'Missing or invalid token'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    print(f"Invalid token: {callback}")
    return jsonify({'error': 'Invalid token'}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("Token expired")
    return jsonify({'error': 'Token expired'}), 401

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(crud_bp)
app.register_blueprint(admin_orders_bp)
app.register_blueprint(product_bp)
app.register_blueprint(category_bp)
app.register_blueprint(order_bp)
app.register_blueprint(search_bp)
app.register_blueprint(dashboard_bp)

if __name__ == "__main__":
    with app.app_context():
        db.create_all() 
    app.run(debug=True, host='0.0.0.0', port=8000)