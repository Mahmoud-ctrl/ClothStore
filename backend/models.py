from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func
import pytz
from werkzeug.security import generate_password_hash, check_password_hash


lebanon_tz = pytz.timezone("Asia/Beirut")
db = SQLAlchemy()

class Gender(db.Model):
    """TOP LEVEL: Men, Women, Kids, Unisex"""
    __tablename__ = 'genders'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    
    product_types = db.relationship("ProductType", back_populates="gender")


class ProductType(db.Model):
    """SECOND LEVEL: Jeans, Shoes, T-Shirts, Dresses"""
    __tablename__ = 'product_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    slug = db.Column(db.String(255), nullable=False)
    
    gender_id = db.Column(db.Integer, db.ForeignKey('genders.id'), nullable=False)
    gender = db.relationship("Gender", back_populates="product_types")
    
    products = db.relationship("Product", back_populates="product_type")

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    images = db.Column(db.ARRAY(db.String), nullable=True)
    title = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.DECIMAL(10, 2), nullable=False)
    original_price = db.Column(db.DECIMAL(10, 2), nullable=True)
    review_count = db.Column(db.Integer, default=0)
    in_stock = db.Column(db.Boolean, default=True)
    is_new = db.Column(db.Boolean, default=False)
    is_sale = db.Column(db.Boolean, default=False)
    sales_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    product_type_id = db.Column(db.Integer, db.ForeignKey('product_types.id'), nullable=False)
    product_type = db.relationship("ProductType", back_populates="products")
    
    # Optional clothing-specific attributes
    sizes = db.Column(db.ARRAY(db.String), nullable=True)  # S, M, L, XL
    colors = db.Column(db.ARRAY(db.String), nullable=True)
    
    # Relationship to order items
    order_items = db.relationship("OrderItem", back_populates="product")

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Customer delivery information
    customer_name = db.Column(db.String(255), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=False)
    
    # Delivery address
    address_line1 = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Order details
    subtotal = db.Column(db.DECIMAL(10, 2), nullable=False)
    shipping_cost = db.Column(db.DECIMAL(10, 2), default=0.00)
    total = db.Column(db.DECIMAL(10, 2), nullable=False)
    
    # Order status
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status = db.Column(db.String(50), default='pending')  # pending, paid, failed, refunded
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    delivered_at = db.Column(db.DateTime(timezone=True), nullable=True)
    
    # Relationships
    order_items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Order {self.order_number}>'
    
    @property
    def item_count(self):
        """Total number of items in the order"""
        return sum(item.quantity for item in self.order_items)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Item details at time of purchase (in case product details change later)
    product_title = db.Column(db.String(255), nullable=False)
    product_image = db.Column(db.String(500), nullable=True)  # Store main image
    price = db.Column(db.DECIMAL(10, 2), nullable=False)  # Price at time of purchase
    
    # Selected options
    size = db.Column(db.String(20), nullable=True)
    color = db.Column(db.String(50), nullable=True)
    
    quantity = db.Column(db.Integer, nullable=False, default=1)
    subtotal = db.Column(db.DECIMAL(10, 2), nullable=False)  # price * quantity
    
    # Relationships
    order = db.relationship("Order", back_populates="order_items")
    product = db.relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f'<OrderItem {self.product_title} x{self.quantity}>'

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # this stores the hash

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)

    def __repr__(self):
        return f'<Admin {self.username}>'
