from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import db, Gender, ProductType, Product, Order, OrderItem
from sqlalchemy import func, desc, cast, Date
from datetime import datetime, timedelta
import pytz

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/admin')

lebanon_tz = pytz.timezone("Asia/Beirut")


def get_lebanon_now():
    return datetime.now(lebanon_tz)


# ==================== MAIN DASHBOARD STATS ====================

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Master stats endpoint — returns all KPI cards in one shot.
    Covers: revenue, orders, products, customers (unique phones).
    """
    now = get_lebanon_now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (today_start.replace(day=1) - timedelta(days=1)).replace(day=1)
    this_month_start = today_start.replace(day=1)

    # ── Revenue ────────────────────────────────────────────────
    total_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(Order.status != 'cancelled').scalar()

    today_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(
        Order.status != 'cancelled',
        Order.created_at >= today_start
    ).scalar()

    this_month_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(
        Order.status != 'cancelled',
        Order.created_at >= this_month_start
    ).scalar()

    last_month_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(
        Order.status != 'cancelled',
        Order.created_at >= last_month_start,
        Order.created_at < this_month_start
    ).scalar()

    revenue_change = _pct_change(float(last_month_revenue), float(this_month_revenue))

    # ── Orders ─────────────────────────────────────────────────
    total_orders = Order.query.count()

    today_orders = Order.query.filter(
        Order.created_at >= today_start
    ).count()

    pending_orders = Order.query.filter_by(status='pending').count()

    this_month_orders = Order.query.filter(
        Order.created_at >= this_month_start
    ).count()

    last_month_orders = Order.query.filter(
        Order.created_at >= last_month_start,
        Order.created_at < this_month_start
    ).count()

    orders_change = _pct_change(last_month_orders, this_month_orders)

    # Status breakdown
    status_counts = dict(
        db.session.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )

    # ── Products ───────────────────────────────────────────────
    total_products = Product.query.count()
    in_stock_count = Product.query.filter_by(in_stock=True).count()
    out_of_stock_count = Product.query.filter_by(in_stock=False).count()
    new_arrivals = Product.query.filter_by(is_new=True).count()
    on_sale = Product.query.filter_by(is_sale=True).count()

    # Critical: out of stock items (list)
    out_of_stock_items = Product.query.filter_by(in_stock=False).order_by(
        desc(Product.sales_count)
    ).limit(5).all()

    # ── Customers (unique phones) ──────────────────────────────
    total_customers = db.session.query(
        func.count(func.distinct(Order.customer_phone))
    ).scalar()

    this_month_customers = db.session.query(
        func.count(func.distinct(Order.customer_phone))
    ).filter(Order.created_at >= this_month_start).scalar()

    last_month_customers = db.session.query(
        func.count(func.distinct(Order.customer_phone))
    ).filter(
        Order.created_at >= last_month_start,
        Order.created_at < this_month_start
    ).scalar()

    customers_change = _pct_change(last_month_customers, this_month_customers)

    return jsonify({
        'revenue': {
            'total': float(total_revenue),
            'today': float(today_revenue),
            'this_month': float(this_month_revenue),
            'last_month': float(last_month_revenue),
            'change_pct': revenue_change,
        },
        'orders': {
            'total': total_orders,
            'today': today_orders,
            'pending': pending_orders,
            'this_month': this_month_orders,
            'last_month': last_month_orders,
            'change_pct': orders_change,
            'status_counts': {
                'pending':    status_counts.get('pending', 0),
                'confirmed':  status_counts.get('confirmed', 0),
                'processing': status_counts.get('processing', 0),
                'shipped':    status_counts.get('shipped', 0),
                'delivered':  status_counts.get('delivered', 0),
                'cancelled':  status_counts.get('cancelled', 0),
            },
        },
        'products': {
            'total': total_products,
            'in_stock': in_stock_count,
            'out_of_stock': out_of_stock_count,
            'new_arrivals': new_arrivals,
            'on_sale': on_sale,
            'critical_stock': [{
                'id': p.id,
                'title': p.title,
                'sales_count': p.sales_count,
                'product_type': p.product_type.name,
            } for p in out_of_stock_items],
        },
        'customers': {
            'total': total_customers,
            'this_month': this_month_customers,
            'last_month': last_month_customers,
            'change_pct': customers_change,
        },
    }), 200


# ==================== REVENUE CHART (12-MONTH TREND) ====================

@dashboard_bp.route('/dashboard/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """
    Returns monthly revenue for the last 12 months.
    Used to power the sparkline/bar chart on the dashboard.
    """
    now = get_lebanon_now()
    months = []

    for i in range(11, -1, -1):
        # First day of each of the last 12 months
        target = (now.replace(day=1) - timedelta(days=1)).replace(day=1) if i > 0 else now.replace(day=1)
        # Walk back i months properly
        month = now.month - i
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        first_day = now.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
        if month == 12:
            last_day = first_day.replace(year=year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=month + 1, day=1)

        revenue = db.session.query(
            func.coalesce(func.sum(Order.total), 0)
        ).filter(
            Order.status != 'cancelled',
            Order.created_at >= first_day,
            Order.created_at < last_day
        ).scalar()

        orders_count = Order.query.filter(
            Order.created_at >= first_day,
            Order.created_at < last_day
        ).count()

        months.append({
            'month': first_day.strftime('%b'),
            'year': first_day.year,
            'label': first_day.strftime('%b %Y'),
            'revenue': float(revenue),
            'orders': orders_count,
        })

    return jsonify({'chart': months}), 200


# ==================== TOP PRODUCTS ====================

@dashboard_bp.route('/dashboard/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """
    Returns top 5 products by sales_count.
    Joins ProductType for context. Mirrors the TopProducts widget.
    """
    products = Product.query.order_by(
        desc(Product.sales_count)
    ).limit(5).all()

    # Total revenue per product = price * sales_count (approximation)
    return jsonify({
        'top_products': [{
            'id': p.id,
            'title': p.title,
            'product_type': p.product_type.name,
            'gender': p.product_type.gender.name,
            'sales_count': p.sales_count,
            'revenue': float(p.price) * p.sales_count,
            'price': float(p.price),
            'in_stock': p.in_stock,
            'is_new': p.is_new,
            'is_sale': p.is_sale,
            'images': p.images,
        } for p in products]
    }), 200


# ==================== GENDER BREAKDOWN ====================

@dashboard_bp.route('/dashboard/gender-breakdown', methods=['GET'])
@jwt_required()
def get_gender_breakdown():
    """
    Returns sales count per Gender (Men, Women, Kids, Unisex).
    Walks: OrderItem → Product → ProductType → Gender.
    """
    rows = (
        db.session.query(Gender.name, func.sum(OrderItem.quantity).label('units_sold'))
        .join(ProductType, ProductType.gender_id == Gender.id)
        .join(Product, Product.product_type_id == ProductType.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status != 'cancelled')
        .group_by(Gender.name)
        .all()
    )

    total = sum(r.units_sold for r in rows) or 1

    return jsonify({
        'breakdown': [{
            'gender': r.name,
            'units_sold': int(r.units_sold),
            'percentage': round((int(r.units_sold) / total) * 100, 1),
        } for r in rows]
    }), 200


# ==================== RECENT ORDERS ====================

@dashboard_bp.route('/dashboard/recent-orders', methods=['GET'])
@jwt_required()
def get_recent_orders():
    """
    Returns the 10 most recent orders.
    Mirrors the RecentOrders table widget on the dashboard.
    """
    orders = Order.query.order_by(desc(Order.created_at)).limit(10).all()

    return jsonify({
        'recent_orders': [{
            'id': o.id,
            'order_number': o.order_number,
            'customer_name': o.customer_name,
            'customer_phone': o.customer_phone,
            'city': o.city,
            'total': float(o.total),
            'status': o.status,
            'payment_status': o.payment_status,
            'item_count': o.item_count,
            'created_at': o.created_at.isoformat() if o.created_at else None,
        } for o in orders]
    }), 200


# ==================== HELPER ====================

def _pct_change(old: float, new: float) -> float:
    """Returns percentage change rounded to 1 decimal. Returns 0 if old is 0."""
    if not old:
        return 0.0
    return round(((new - old) / old) * 100, 1)