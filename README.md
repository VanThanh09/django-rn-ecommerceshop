# E-Shop

This is a Django-based web application for a ecommerce shop.

## Features
1. **Customer**
- Register/Login account (with avatar).
- Browse product listings, search, filter, and pagination (20 products/page).
- Review products (1–5 stars), write comments, reply to comments.
- Place online orders and payment (momo).
- Track order status.
2. **Seller**
- Register as a seller and create a store.
- Upload and manage products (description, image, price).
- View business reports, product categories, and sales by month, quarter, and year.
3. **Staff**
- Verify seller/business account registration.
- Support managing stores and products.
4. **Admin**
- Manage the entire system: users, sellers, and staff.
- View statistics on sales frequency and business performance (monthly, quarterly, yearly).
- Compare product sales across stores to support customer decision-making.
- Monitor system-wide transactions and revenue

## Prerequisites

- Python 3.x
- Django 3.x or later
- pip (Python package installer)

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/VanThanh09/lulu-shop.git
    cd lulu-shop
    ```

2. Create and activate a virtual environment:

    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required packages:

    ```sh
    pip install -r requirements.txt
    ```

## Database Setup

1. Delete existing migrations: 

- You need delete all migration files inside the migrations folder except for `__init__.py`.

2. Apply the migrations:

    ```sh
    python manage.py makemigrations
    ```
   ```sh
    python manage.py migrate
    ```

3. Load data:

    ```sh
    python manage.py loaddata data.json
    ```
   
4. Admin User Account

- Username: admin
- Password: 123
    
## Running the Server

1. Start the development server:

    ```sh
    python manage.py runserver
    ```

2. Open your web browser and go to `http://127.0.0.1:8000/` to see the application.
