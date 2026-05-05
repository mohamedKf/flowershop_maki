"""
Authentication API.

Endpoints:
    POST /api/auth/signup/         — customer signup (no code needed)
    POST /api/auth/staff-signup/   — manager/worker signup (needs code + shop_slug)
    POST /api/auth/login/          — username + password → token
    POST /api/auth/logout/         — invalidate token
    GET  /api/auth/me/             — current user info
"""
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Shop, User


class CustomerSignupSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Имя пользователя уже занято.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email уже зарегистрирован.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(
            password=password, role=User.Role.CUSTOMER, **validated_data
        )


class StaffSignupSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    signup_code = serializers.CharField(write_only=True)
    shop_slug = serializers.SlugField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Имя пользователя уже занято.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email уже зарегистрирован.')
        return value

    def validate_shop_slug(self, value):
        if not Shop.objects.filter(slug=value, is_active=True).exists():
            raise serializers.ValidationError('Магазин не найден.')
        return value

    def validate(self, attrs):
        code = attrs['signup_code']
        if code == settings.MANAGER_SIGNUP_CODE:
            attrs['role'] = User.Role.MANAGER
        elif code == settings.WORKER_SIGNUP_CODE:
            attrs['role'] = User.Role.WORKER
        else:
            raise serializers.ValidationError({'signup_code': 'Неверный код регистрации.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('signup_code')
        password = validated_data.pop('password')
        shop = Shop.objects.get(slug=validated_data.pop('shop_slug'))
        role = validated_data.pop('role')
        user = User.objects.create_user(
            password=password, role=role, shop=shop, **validated_data
        )
        if role == User.Role.MANAGER:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserInfoSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_slug = serializers.SlugField(source='shop.slug', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'role', 'shop', 'shop_name', 'shop_slug', 'date_joined',
        ]
        read_only_fields = fields


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = CustomerSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {'token': token.key, 'user': UserInfoSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def staff_signup_view(request):
    serializer = StaffSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {'token': token.key, 'user': UserInfoSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password'],
    )
    if not user:
        return Response(
            {'detail': 'Неверный логин или пароль.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not user.is_active:
        return Response({'detail': 'Аккаунт деактивирован.'}, status=status.HTTP_403_FORBIDDEN)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': UserInfoSerializer(user).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Вы вышли из системы.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserInfoSerializer(request.user).data)
