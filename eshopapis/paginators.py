from rest_framework.pagination import PageNumberPagination

class ProductPage(PageNumberPagination):
    page_size = 10