# E-Shop

This is a Django-based web application for a ecommerce shop.

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