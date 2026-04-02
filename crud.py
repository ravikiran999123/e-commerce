from sqlalchemy.orm import Session
from fastapi import HTTPException
import models, schemas, auth
from typing import Optional


# Users
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = auth.hash_password(user.password)
    db_user = models.User(name=user.name, email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Categories
def get_categories(db: Session):
    return db.query(models.Category).all()


def create_category(db: Session, cat: schemas.CategoryCreate):
    obj = models.Category(**cat.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# Products
def get_products(db: Session, skip: int = 0, limit: int = 20, category_id: Optional[int] = None):
    q = db.query(models.Product)
    if category_id:
        q = q.filter(models.Product.category_id == category_id)
    return q.offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def create_product(db: Session, product: schemas.ProductCreate):
    obj = models.Product(**product.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    obj = get_product(db, product_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in product.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_product(db: Session, product_id: int):
    obj = get_product(db, product_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(obj)
    db.commit()


# Cart
def get_cart(db: Session, user_id: int):
    return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()


def add_to_cart(db: Session, user_id: int, item: schemas.CartItemCreate):
    existing = db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == item.product_id
    ).first()
    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
        return existing
    cart_item = models.CartItem(user_id=user_id, **item.dict())
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item


def update_cart_item(db: Session, item_id: int, user_id: int, qty: schemas.CartItemUpdate):
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id, models.CartItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = qty.quantity
    db.commit()
    db.refresh(item)
    return item


def remove_from_cart(db: Session, item_id: int, user_id: int):
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id, models.CartItem.user_id == user_id
    ).first()
    if item:
        db.delete(item)
        db.commit()


# Orders
def create_order(db: Session, user_id: int, order_data: schemas.OrderCreate):
    cart_items = get_cart(db, user_id)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum(item.product.price * item.quantity for item in cart_items)
    order = models.Order(
        user_id=user_id,
        total_amount=total,
        shipping_address=order_data.shipping_address,
        payment_id=order_data.payment_id
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )
        db.add(order_item)
        # Reduce stock
        product = item.product
        product.stock = max(0, product.stock - item.quantity)

    # Clear cart
    db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
    db.commit()
    db.refresh(order)
    return order


def get_user_orders(db: Session, user_id: int):
    return db.query(models.Order).filter(models.Order.user_id == user_id).all()


def get_order(db: Session, order_id: int, user_id: int):
    return db.query(models.Order).filter(
        models.Order.id == order_id, models.Order.user_id == user_id
    ).first()


def get_all_orders(db: Session):
    return db.query(models.Order).all()


def update_order_status(db: Session, order_id: int, status: str):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    db.refresh(order)
    return order
