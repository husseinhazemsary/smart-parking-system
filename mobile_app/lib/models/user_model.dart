class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phoneNumber;
  final String? dateOfBirth; // ISO date: YYYY-MM-DD
  final String provider; // LOCAL, GOOGLE, APPLE
  final String createdAt; // ISO 8601 instant

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phoneNumber,
    this.dateOfBirth,
    required this.provider,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        phoneNumber: json['phoneNumber'] as String?,
        dateOfBirth: json['dateOfBirth'] as String?,
        provider: json['provider'] as String? ?? 'LOCAL',
        createdAt: json['createdAt'] as String? ?? '',
      );

  UserModel copyWith({
    String? fullName,
    String? phoneNumber,
    String? dateOfBirth,
  }) =>
      UserModel(
        id: id,
        fullName: fullName ?? this.fullName,
        email: email,
        phoneNumber: phoneNumber ?? this.phoneNumber,
        dateOfBirth: dateOfBirth ?? this.dateOfBirth,
        provider: provider,
        createdAt: createdAt,
      );
}
