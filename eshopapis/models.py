from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class UserRole(models.TextChoices):
        ADMIN = "AD", _("ADMIN")
        EMPLOYEE = "EM", _("EMPLOYEE")
        SELLER = "SE", _("SELLER")
        CUSTOMER = "CUS", _("CUSTOMER")

    avatar = CloudinaryField(null=True)
    user_role = models.CharField(max_length=3, choices=UserRole)


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date=models.DateTimeField(auto_now_add=True)
    updated_date=models.DateTimeField(auto_now=True)
    logo = CloudinaryField(null=True)

    class Meta:
        abstract=True


class Store(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    store = models.ForeignKey(Store, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Category(models.Model):
    name=models.CharField(max_length=255)
    products=models.ManyToManyField('Product')

    def __str__(self):
        return self.name


class Attribute(models.Model):
    name=models.CharField(max_length=255)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    value=models.CharField(max_length=255)
    attribute=models.ForeignKey(Attribute, on_delete=models.CASCADE)

    def __str__(self):
        return self.value


class ProductVariant(BaseModel):
    quantity=models.IntegerField(default=0)
    price=models.FloatField(default=0)
    product=models.ForeignKey(Product, on_delete=models.CASCADE)
    attributes=models.ManyToManyField('AttributeValue')


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        ONLINE = 'ON', _("ONLINE")
        OFFLINE = 'OF', _("OFFLINE")

    class OrderStatus(models.TextChoices):
        PENDING = 'PE', _("PENDING")
        SUCCESS = 'SU', _("SUCCESS")
        SHIPPING = 'SH', _("SHIPPING")
        CANCEL = 'CA', _("CANCEL")

    created_date=models.DateTimeField(auto_now_add=True)
    payment_method=models.CharField(max_length=2, choices=PaymentMethod)
    order_status=models.CharField(max_length=2, choices=OrderStatus)
    total_price=models.FloatField(default=0)
    customer=models.ForeignKey(User, on_delete=models.SET_NULL, null=True)


class OrderDetail(models.Model):
    quantity=models.IntegerField(default=1)
    unit_price=models.FloatField()
    order=models.ForeignKey(Order, on_delete=models.CASCADE)
    product=models.ForeignKey(ProductVariant, on_delete=models.SET_NULL)


class Cart(models.Model):
    quantity=models.IntegerField(default=1)
    product=models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    user=models.ForeignKey(User, on_delete=models.CASCADE)


class Interaction(models.Model):
    user=models.ForeignKey(User, on_delete=models.CASCADE)
    product=models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        abstract=True


class Comment(Interaction):
    content=models.TextField()
    parent=models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name="replies")

    def __str__(self):
        return self.content

from django.core.validators import MinValueValidator, MaxValueValidator

class Rating(Interaction):
    rating=models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])

    def __str__(self):
        return self.rating