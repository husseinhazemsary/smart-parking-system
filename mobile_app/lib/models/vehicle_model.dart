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

  // Always formats as: digits then space-separated letters (e.g. أ ب ج ١٢٣٤)
  String get displayPlateNumber {
    final raw     = plateNumber;
    final digits  = raw.runes
        .where((r) => (r >= 0x30 && r <= 0x39) || (r >= 0x0660 && r <= 0x0669))
        .map((r) => String.fromCharCode(r >= 0x30 && r <= 0x39 ? r - 0x30 + 0x0660 : r))
        .join();
    final letters = raw.runes
        .where((r) => r >= 0x0621 && r <= 0x064A)
        .map(String.fromCharCode)
        .toList();
    final parts = <String>[];
    if (letters.isNotEmpty) parts.add(letters.join(' '));
    if (digits.isNotEmpty)  parts.add(digits);
    return parts.isEmpty ? raw : parts.join(' ');
  }

  String get displayName {
    if (nickname?.isNotEmpty == true) return nickname!;
    if (makeAndModel?.isNotEmpty == true) return makeAndModel!;
    return displayPlateNumber;
  }
}
