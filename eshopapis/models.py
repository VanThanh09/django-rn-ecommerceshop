from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    # Các vài trò người dùng trong hệ thống
    class UserRole(models.TextChoices):
        ADMIN = "AD", _("ADMIN")  # Người quản trị hệ thống
        EMPLOYEE = "EM", _("EMPLOYEE")  # Nhân viên của sàn giao dịch
        SELLER = "SE", _("SELLER")  # Người dùng sau khi đăng kí là người bán hàng trên sàn
        CUSTOMER = "CUS", _("CUSTOMER")  # Khách hàng

    avatar = CloudinaryField(null=True)
    user_role = models.CharField(max_length=3, choices=UserRole, default=UserRole.CUSTOMER)


class VerificationSeller(models.Model):
    class RequestStatus(models.TextChoices):
        PEDING = 'PE', _("PENDING")
        ACCEPT = 'AC', _("ACCEPT")
        REJECTED = 'RE', _("REJECTED")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_request')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=2, choices=RequestStatus, default=RequestStatus.PEDING)
    reason = models.TextField(null=True, blank=True)
    employee = models.ForeignKey(User,on_delete=models.PROTECT, related_name='employee', null=True, blank=True)

    temp_store_name = models.CharField(max_length=255)
    temp_store_description = models.TextField()
    temp_store_logo = CloudinaryField()

    class Meta:
        unique_together=['status', 'user']

    def __str__(self):
        return str(self.status)



class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    logo = CloudinaryField(null=True, blank=True)

    class Meta:
        abstract = True


class Store(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE)  # Chủ sở hữu cửa hàng

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, blank=True)  # Sản phẩm thuộc cửa hàng nào

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=255)
    products = models.ManyToManyField('Product', blank=True)  # Một danh mục chứa nhiều sản phẩm, sản phẩm tộc nhiều danh mục

    def __str__(self):
        return self.name


class Attribute(models.Model):
    name = models.CharField(max_length=255)  # Tên thuộc tính (màu sắc, size...)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    value = models.CharField(max_length=255)  # Giá trị của thuộc tính (ví dụ: đỏ, xanh, L, M...)
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)  # Tên  thuộc tính của giá trị đó

    def __str__(self):
        return self.value


class ProductVariant(BaseModel):
    quantity = models.IntegerField(default=0)
    price = models.FloatField(default=0)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)  # Thuộc về sản phẩm nào
    attributes = models.ManyToManyField('AttributeValue', null=True, blank=True)  # Các giá trị thuộc tính của biến thể

    def __str__(self):
        return f"{self.product.name} - Tồn kho: {self.quantity} - Giá: {"{:,.0f}".format(self.price)} VND"


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        ONLINE = 'ON', _("ONLINE")  # Thanh toán online ngay khi bắt đầu mua
        OFFLINE = 'OF', _("OFFLINE")  # Thanh toán sau khi nhận được hàng

    class OrderStatus(models.TextChoices):
        PENDING = 'PE', _("PENDING")  # Khi sản phẩm bắt được khách hàng xác nhận mua
        SUCCESS = 'SU', _("SUCCESS")  # Sau khi khách hàng xác nhận đã nhận được hàng
        SHIPPING = 'SH', _("SHIPPING")  # Sản phẩm đã rời khỏi kho của người bán
        CANCEL = 'CA', _("CANCEL")  # Khách hàng hủy đơn khi đang ở PENDING, khách không nhận hàng, ....

    created_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=2, choices=PaymentMethod)  # Phương thức thanh toán
    order_status = models.CharField(max_length=2, choices=OrderStatus)  # Trạng thái đơn hàng
    total_price = models.FloatField(default=0)
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)


class OrderDetail(models.Model):
    quantity = models.IntegerField(default=1)
    unit_price = models.FloatField()
    order = models.ForeignKey(Order, on_delete=models.CASCADE)  # Thuộc order nào
    product = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True)  # Biến thể sản phẩm nào


class Cart(models.Model):
    active = models.BooleanField(
        default=True)  # Khi sản phẩm hết số lượng, active=False, không thể mua sản phẩm này dù con trong giỏ hàng
    quantity = models.IntegerField(default=1)
    product = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)  # Biến thể sản phẩm nào
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class Interaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User nào tương tác
    product = models.ForeignKey(Product, on_delete=models.CASCADE)  # Tương tác với sản phẩm nào

    class Meta:
        abstract = True


class Comment(Interaction):
    content = models.TextField()  # Nội dung bình luận
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE,
                               related_name="replies")  # Bình luận cha, trả lời bình luận khác, nếu là bình luận chính của sản phẩm thì null

    def __str__(self):
        return self.content


from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(Interaction):
    rating = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(5)])  # Đánh giá sao ( tối thiểu 1s tối đa 5s)

    def __str__(self):
        return str(self.rating)
