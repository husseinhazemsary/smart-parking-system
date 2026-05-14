class VehicleModel {
  final String id;
  final String plateNumber;
  final String? nickname;
  final String vehicleType; // SEDAN | SUV | TRUCK
  final String? makeAndModel;
  final bool isDefault;
  final bool autoPay;
  final String createdAt;

  const VehicleModel({
    required this.id,
    required this.plateNumber,
    this.nickname,
    required this.vehicleType,
    this.makeAndModel,
    required this.isDefault,
    required this.autoPay,
    required this.createdAt,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) => VehicleModel(
        id: json['id'] as String,
        plateNumber: json['plateNumber'] as String,
        nickname: json['nickname'] as String?,
        vehicleType: json['vehicleType'] as String? ?? 'SEDAN',
        makeAndModel: json['makeAndModel'] as String?,
        isDefault: json['isDefault'] as bool? ?? false,
        autoPay: json['autoPay'] as bool? ?? false,
        createdAt: json['createdAt'] as String? ?? '',
      );

  VehicleModel copyWith({
    String? plateNumber,
    String? nickname,
    String? vehicleType,
    String? makeAndModel,
    bool? isDefault,
    bool? autoPay,
  }) =>
      VehicleModel(
        id: id,
        plateNumber: plateNumber ?? this.plateNumber,
        nickname: nickname ?? this.nickname,
        vehicleType: vehicleType ?? this.vehicleType,
        makeAndModel: makeAndModel ?? this.makeAndModel,
        isDefault: isDefault ?? this.isDefault,
        autoPay: autoPay ?? this.autoPay,
        createdAt: createdAt,
      );

  String get displayName {
    if (nickname?.isNotEmpty == true) return nickname!;
    if (makeAndModel?.isNotEmpty == true) return makeAndModel!;
    return plateNumber;
  }
}
