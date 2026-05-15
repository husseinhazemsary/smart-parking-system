class SavedPlaceModel {
  final String id;
  final String parkingLotId;
  final String parkingLotName;
  final String address;
  final DateTime savedAt;

  const SavedPlaceModel({
    required this.id,
    required this.parkingLotId,
    required this.parkingLotName,
    required this.address,
    required this.savedAt,
  });

  factory SavedPlaceModel.fromJson(Map<String, dynamic> json) => SavedPlaceModel(
        id: json['id'] as String,
        parkingLotId: json['parkingLotId'] as String,
        parkingLotName: json['parkingLotName'] as String,
        address: json['address'] as String,
        savedAt: DateTime.parse(json['savedAt'] as String),
      );
}
