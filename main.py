from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import engine, get_db
import models, schemas, crud, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ecommerce API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return auth.get_current_user(token, db)


def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Auth routes
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


# Product routes
@app.get("/products", response_model=List[schemas.ProductOut])
def list_products(skip: int = 0, limit: int = 20, category_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit, category_id=category_id)


@app.get("/products/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return crud.create_product(db, product)


@app.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return crud.update_product(db, product_id, product)


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    crud.delete_product(db, product_id)
    return {"message": "Product deleted"}


# Category routes
@app.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@app.post("/categories", response_model=schemas.CategoryOut)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return crud.create_category(db, cat)


# Cart routes
@app.get("/cart", response_model=List[schemas.CartItemOut])
def get_cart(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.get_cart(db, user.id)


@app.post("/cart", response_model=schemas.CartItemOut)
def add_to_cart(item: schemas.CartItemCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.add_to_cart(db, user.id, item)


@app.put("/cart/{item_id}", response_model=schemas.CartItemOut)
def update_cart_item(item_id: int, qty: schemas.CartItemUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.update_cart_item(db, item_id, user.id, qty)


@app.delete("/cart/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    crud.remove_from_cart(db, item_id, user.id)
    return {"message": "Item removed"}


# Order routes
@app.post("/orders", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.create_order(db, user.id, order)


@app.get("/orders", response_model=List[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.get_user_orders(db, user.id)


@app.get("/orders/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    order = crud.get_order(db, order_id, user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# Admin order management
@app.get("/admin/orders", response_model=List[schemas.OrderOut])
def admin_list_orders(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return crud.get_all_orders(db)


@app.put("/admin/orders/{order_id}/status")
def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return crud.update_order_status(db, order_id, status_update.status)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
