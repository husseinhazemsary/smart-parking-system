String _parseTime(dynamic val) {
  if (val == null) return '';
  if (val is String) return val.length >= 5 ? val.substring(0, 5) : val;
  if (val is List && val.length >= 2) {
    return '${(val[0] as int).toString().padLeft(2, '0')}'
        ':${(val[1] as int).toString().padLeft(2, '0')}';
  }
  return '';
}

String displayTime(String hhmm) {
  if (hhmm.isEmpty) return '–';
  final parts = hhmm.split(':');
  final h = int.tryParse(parts[0]) ?? 0;
  final m = int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0;
  final period = h >= 12 ? 'PM' : 'AM';
  final dh = h == 0 ? 12 : (h > 12 ? h - 12 : h);
  return m == 0 ? '$dh$period' : '$dh:${m.toString().padLeft(2, '0')}$period';
}

bool isCurrentlyOpen(String open, String close) {
  if (open.isEmpty || close.isEmpty) return true;
  int toMins(String t) {
    final p = t.split(':');
    return (int.tryParse(p[0]) ?? 0) * 60 + (int.tryParse(p.length > 1 ? p[1] : '0') ?? 0);
  }
  final now = DateTime.now();
  final cur = now.hour * 60 + now.minute;
  final o = toMins(open), c = toMins(close);
  return c > o ? cur >= o && cur < c : cur >= o || cur < c;
}

class ParkingLotSummary {
  final String id;
  final String name;
  final String address;
  final double? distanceKm;
  final int available;
  final int total;
  final double hourlyRate;
  final String openingTime;
  final String closingTime;
  final String? imageUrl;

  const ParkingLotSummary({
    required this.id,
    required this.name,
    required this.address,
    required this.available,
    required this.total,
    required this.hourlyRate,
    required this.openingTime,
    required this.closingTime,
    this.distanceKm,
    this.imageUrl,
  });

  factory ParkingLotSummary.fromJson(Map<String, dynamic> j) {
    return ParkingLotSummary(
      id: j['id'] as String,
      name: j['name'] as String,
      address: j['address'] as String,
      distanceKm: (j['distanceKm'] as num?)?.toDouble(),
      available: j['availableSlots'] as int,
      total: j['totalSlots'] as int,
      hourlyRate: (j['hourlyRate'] as num).toDouble(),
      openingTime: _parseTime(j['openingTime']),
      closingTime: _parseTime(j['closingTime']),
      imageUrl: j['imageUrl'] as String?,
    );
  }

  String get displayOpeningTime => displayTime(openingTime);
  String get displayClosingTime => displayTime(closingTime);
  bool get isOpenNow => isCurrentlyOpen(openingTime, closingTime);
}

class ParkingLotDetail {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final double hourlyRate;
  final String openingTime;
  final String closingTime;
  final List<String> amenities;
  final int numberOfGates;
  final int available;
  final int total;
  final String? imageUrl;

  const ParkingLotDetail({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.hourlyRate,
    required this.openingTime,
    required this.closingTime,
    required this.amenities,
    required this.numberOfGates,
    required this.available,
    required this.total,
    this.imageUrl,
  });

  factory ParkingLotDetail.fromJson(Map<String, dynamic> j) {
    return ParkingLotDetail(
      id: j['id'] as String,
      name: j['name'] as String,
      address: j['address'] as String,
      latitude: (j['latitude'] as num).toDouble(),
      longitude: (j['longitude'] as num).toDouble(),
      hourlyRate: (j['hourlyRate'] as num).toDouble(),
      openingTime: _parseTime(j['openingTime']),
      closingTime: _parseTime(j['closingTime']),
      amenities: (j['amenities'] as List? ?? []).cast<String>(),
      numberOfGates: j['numberOfGates'] as int? ?? 1,
      available: j['availableSlots'] as int,
      total: j['totalSlots'] as int,
      imageUrl: j['imageUrl'] as String?,
    );
  }

  String get displayOpeningTime => displayTime(openingTime);
  String get displayClosingTime => displayTime(closingTime);
  bool get isOpenNow => isCurrentlyOpen(openingTime, closingTime);
}
