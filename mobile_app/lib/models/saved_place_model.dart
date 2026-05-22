class SavedPlaceModel {
  final String id;
  final String parkingLotId;
  final String parkingLotName;
  final String? parkingLotNameAr;
  final String address;
  final String? addressAr;
  final DateTime savedAt;

  const SavedPlaceModel({
    required this.id,
    required this.parkingLotId,
    required this.parkingLotName,
    this.parkingLotNameAr,
    required this.address,
    this.addressAr,
    required this.savedAt,
  });

  String localizedName(bool isArabic) =>
      isArabic && (parkingLotNameAr?.isNotEmpty == true) ? parkingLotNameAr! : parkingLotName;

  String localizedAddress(bool isArabic) =>
      isArabic && (addressAr?.isNotEmpty == true) ? addressAr! : address;

  factory SavedPlaceModel.fromJson(Map<String, dynamic> json) => SavedPlaceModel(
        id: json['id'] as String,
        parkingLotId: json['parkingLotId'] as String,
        parkingLotName: json['parkingLotName'] as String,
        parkingLotNameAr: json['parkingLotNameAr'] as String?,
        address: json['address'] as String,
        addressAr: json['addressAr'] as String?,
        savedAt: DateTime.parse(json['savedAt'] as String),
      );
}
