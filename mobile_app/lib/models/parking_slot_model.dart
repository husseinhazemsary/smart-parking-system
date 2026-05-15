enum ParkingSlotType { regular, disabled, ev }

enum ParkingSlotStatus { available, occupied }

class ParkingSlotModel {
  final String id;
  final String slotLabel;
  final ParkingSlotType slotType;
  final ParkingSlotStatus status;

  const ParkingSlotModel({
    required this.id,
    required this.slotLabel,
    required this.slotType,
    required this.status,
  });

  bool get isOccupied => status == ParkingSlotStatus.occupied;

  factory ParkingSlotModel.fromJson(Map<String, dynamic> j) {
    return ParkingSlotModel(
      id: j['id'] as String,
      slotLabel: j['slotLabel'] as String,
      slotType: _parseType(j['slotType'] as String),
      status: _parseStatus(j['status'] as String),
    );
  }

  static ParkingSlotType _parseType(String raw) {
    switch (raw.toUpperCase()) {
      case 'DISABLED':
        return ParkingSlotType.disabled;
      case 'EV':
        return ParkingSlotType.ev;
      default:
        return ParkingSlotType.regular;
    }
  }

  static ParkingSlotStatus _parseStatus(String raw) {
    return raw.toUpperCase() == 'OCCUPIED'
        ? ParkingSlotStatus.occupied
        : ParkingSlotStatus.available;
  }
}
