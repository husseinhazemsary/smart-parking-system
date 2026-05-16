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

const _dayNames = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

bool isCurrentlyOpen(String open, String close, List<String> operatingDays) {
  final now = DateTime.now();
  if (operatingDays.isNotEmpty) {
    final today = _dayNames[now.weekday - 1];
    if (!operatingDays.contains(today)) return false;
  }
  if (open.isEmpty || close.isEmpty) return true;
  int toMins(String t) {
    final p = t.split(':');
    return (int.tryParse(p[0]) ?? 0) * 60 + (int.tryParse(p.length > 1 ? p[1] : '0') ?? 0);
  }
  final cur = now.hour * 60 + now.minute;
  final o = toMins(open), c = toMins(close);
  return c > o ? cur >= o && cur < c : cur >= o || cur < c;
}

class ParkingLotSummary {
  final String id;
  final String name;
  final String? nameAr;
  final String address;
  final String? addressAr;
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
    this.nameAr,
    this.addressAr,
    this.distanceKm,
    this.imageUrl,
  });

  factory ParkingLotSummary.fromJson(Map<String, dynamic> j) {
    return ParkingLotSummary(
      id: j['id'] as String,
      name: j['name'] as String,
      nameAr: j['nameAr'] as String?,
      address: j['address'] as String,
      addressAr: j['addressAr'] as String?,
      distanceKm: (j['distanceKm'] as num?)?.toDouble(),
      available: j['availableSlots'] as int,
      total: j['totalSlots'] as int,
      hourlyRate: (j['hourlyRate'] as num).toDouble(),
      openingTime: _parseTime(j['openingTime']),
      closingTime: _parseTime(j['closingTime']),
      imageUrl: j['imageUrl'] as String?,
    );
  }

  String localizedName(bool isArabic) =>
      (isArabic && nameAr != null && nameAr!.isNotEmpty) ? nameAr! : name;

  String localizedAddress(bool isArabic) =>
      (isArabic && addressAr != null && addressAr!.isNotEmpty) ? addressAr! : address;

  String get displayOpeningTime => displayTime(openingTime);
  String get displayClosingTime => displayTime(closingTime);
  bool get isOpenNow => isCurrentlyOpen(openingTime, closingTime, const []);
}

class ParkingLotDetail {
  final String id;
  final String name;
  final String? nameAr;
  final String address;
  final String? addressAr;
  final String? phoneNumber;
  final double latitude;
  final double longitude;
  final double hourlyRate;
  final String openingTime;
  final String closingTime;
  final List<String> amenities;
  final List<String> operatingDays;
  final int numberOfGates;
  final int available;
  final int total;
  final String? imageUrl;
  final bool hasSubscriptions;

  const ParkingLotDetail({
    required this.id,
    required this.name,
    required this.address,
    this.nameAr,
    this.addressAr,
    this.phoneNumber,
    required this.latitude,
    required this.longitude,
    required this.hourlyRate,
    required this.openingTime,
    required this.closingTime,
    required this.amenities,
    required this.operatingDays,
    required this.numberOfGates,
    required this.available,
    required this.total,
    this.imageUrl,
    this.hasSubscriptions = false,
  });

  factory ParkingLotDetail.fromJson(Map<String, dynamic> j) {
    return ParkingLotDetail(
      id: j['id'] as String,
      name: j['name'] as String,
      nameAr: j['nameAr'] as String?,
      address: j['address'] as String,
      addressAr: j['addressAr'] as String?,
      phoneNumber: j['phoneNumber'] as String?,
      latitude: (j['latitude'] as num).toDouble(),
      longitude: (j['longitude'] as num).toDouble(),
      hourlyRate: (j['hourlyRate'] as num).toDouble(),
      openingTime: _parseTime(j['openingTime']),
      closingTime: _parseTime(j['closingTime']),
      amenities: (j['amenities'] as List? ?? []).cast<String>(),
      operatingDays: (j['operatingDays'] as List? ?? []).cast<String>(),
      numberOfGates: j['numberOfGates'] as int? ?? 1,
      available: j['availableSlots'] as int,
      total: j['totalSlots'] as int,
      imageUrl: j['imageUrl'] as String?,
      hasSubscriptions: j['hasSubscriptions'] as bool? ?? false,
    );
  }

  String get displayOpeningTime => displayTime(openingTime);
  String get displayClosingTime => displayTime(closingTime);
  bool get isOpenNow => isCurrentlyOpen(openingTime, closingTime, operatingDays);

  String localizedName(bool isArabic) =>
      (isArabic && nameAr != null && nameAr!.isNotEmpty) ? nameAr! : name;

  String localizedAddress(bool isArabic) =>
      (isArabic && addressAr != null && addressAr!.isNotEmpty) ? addressAr! : address;
}

class SubscriptionPlan {
  final String id;
  final String name;
  final int durationDays;
  final double price;
  final String? description;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.durationDays,
    required this.price,
    this.description,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> j) {
    return SubscriptionPlan(
      id: j['id'] as String,
      name: j['name'] as String,
      durationDays: j['durationDays'] as int,
      price: (j['price'] as num).toDouble(),
      description: j['description'] as String?,
    );
  }

  String get durationLabel {
    if (durationDays == 1) return '1 Day';
    if (durationDays == 7) return '1 Week';
    if (durationDays == 30) return '1 Month';
    if (durationDays == 90) return '3 Months';
    if (durationDays == 180) return '6 Months';
    if (durationDays == 365) return '1 Year';
    if (durationDays % 30 == 0) return '${durationDays ~/ 30} Months';
    if (durationDays % 7 == 0) return '${durationDays ~/ 7} Weeks';
    return '$durationDays Days';
  }
}
