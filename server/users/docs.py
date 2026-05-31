# drf_yasg removed for Python 3.14 compatibility
# The following schemas are no longer used without drf_yasg

# from drf_yasg import openapi
#
# UserSchema = openapi.Schema(
#     type=openapi.TYPE_OBJECT,
#     properties={
#         'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID'),
#         'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email'),
#         'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
#         # Add other user fields here
#     },
#     required=['id', 'email', 'username']
# )
#
# user_list_response = openapi.Response(
#     description='List of users',
#     schema=openapi.Schema(
#         type=openapi.TYPE_ARRAY,
#         items=UserSchema
#     )
# )
#
# user_detail_response = openapi.Response(
#     description='Single user detail',
#     schema=UserSchema
# )
