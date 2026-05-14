// Add / Edit Vehicle screen.
// Pass [existing] to enter edit mode; omit it to create a new vehicle.
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../models/vehicle_model.dart';
import '../../providers/vehicle_provider.dart';
import '../../services/car_search_service.dart';
import '../../services/plate_scan_service.dart';
import '../../l10n/app_localizations.dart';

class AddVehicleScreen extends StatefulWidget {
  final VehicleModel? existing;
  const AddVehicleScreen({super.key, this.existing});

  @override
  State<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _plateController    = TextEditingController();
  final _nicknameController = TextEditingController();
  final _makeController     = TextEditingController();
  final _makeFocusNode      = FocusNode();

  String _selectedType      = 'SEDAN';
  bool   _setAsDefault      = true;
  bool   _autoPay           = true;
  bool   _isEV              = false;
  bool   _isScanning        = false;
  bool   _evUserOverridden  = false;
  bool   _typeUserOverridden = false;

  final List<Map<String, dynamic>> _vehicleTypes = [
    {'label': 'Sedan',      'value': 'SEDAN',      'icon': Icons.directions_car},
    {'label': 'SUV',        'value': 'SUV',         'icon': Icons.directions_car_filled},
    {'label': 'Truck',      'value': 'TRUCK',       'icon': Icons.local_shipping},
    {'label': 'Motorcycle', 'value': 'MOTORCYCLE',  'icon': Icons.two_wheeler},
  ];

  static const _evKeywords = [
    'tesla', 'rivian', 'lucid', 'polestar', 'nio', 'fisker', 'canoo',
    'byd', 'xpeng', 'li auto', 'zeekr',
    'nissan leaf', 'bolt', 'chevrolet bolt',
    'ioniq 5', 'ioniq 6', 'ioniq5', 'ioniq6', 'kia ev6', 'kia ev',
    'bmw i3', 'bmw i4', 'bmw ix', 'bmw i5', 'bmw i7',
    'mercedes eqs', 'mercedes eqe', 'mercedes eqa', 'mercedes eqb', 'mercedes eqc',
    'eqs', 'eqe', 'eqa', 'eqb', 'eqc',
    'audi e-tron', 'audi etron', 'audi q4 e-tron',
    'porsche taycan',
    'volkswagen id', 'vw id', 'id.3', 'id.4', 'id.5', 'id.7',
    'volvo ex30', 'volvo ex40', 'volvo ec40', 'volvo c40',
    'ford mustang mach-e', 'ford mach-e', 'ford f-150 lightning', 'f-150 lightning',
    'gmc hummer ev', 'hummer ev',
    'mini cooper se', 'mini se',
    'jaguar i-pace', 'i-pace',
    'hyundai ioniq',
  ];

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    CarSearchService.prefetchMakes();
    final v = widget.existing;
    if (v != null) {
      _plateController.text    = v.plateNumber;
      _nicknameController.text = v.nickname ?? '';
      _makeController.text     = v.makeAndModel ?? '';
      _selectedType            = v.vehicleType;
      _setAsDefault            = v.isDefault;
      _autoPay                 = v.autoPay;
      _detectEV(v.makeAndModel ?? '');
    }
  }

  @override
  void dispose() {
    _plateController.dispose();
    _nicknameController.dispose();
    _makeController.dispose();
    _makeFocusNode.dispose();
    super.dispose();
  }

  void _detectEV(String text) {
    // When the field is cleared, reset overrides so auto-detection resumes.
    if (text.trim().isEmpty) {
      _evUserOverridden   = false;
      _typeUserOverridden = false;
    }
    // If the user manually toggled the switch, respect their choice.
    if (_evUserOverridden) return;
    final lower    = text.toLowerCase();
    final detected = _evKeywords.any((kw) => lower.contains(kw));
    if (detected != _isEV) setState(() => _isEV = detected);
  }

  Future<void> _confirmDelete() async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.deleteVehicle),
        content: Text(l10n.removeVehicleConfirm(widget.existing!.displayName)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.cancel)),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(l10n.delete,
                  style: const TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final provider = context.read<VehicleProvider>();
    final ok = await provider.deleteVehicle(widget.existing!.id);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
    } else {
      final l10n2 = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? l10n2.failedToDeleteVehicle)),
      );
    }
  }

  Future<void> _scanPlate() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: Text(AppLocalizations.of(ctx)!.takeAPhoto),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: Text(AppLocalizations.of(ctx)!.chooseFromGallery),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final picked = await ImagePicker().pickImage(source: source, imageQuality: 90);
    if (picked == null || !mounted) return;

    setState(() => _isScanning = true);
    final plate = await PlateScanService.scanPlate(File(picked.path));
    if (!mounted) return;
    setState(() => _isScanning = false);

    if (plate != null) {
      _plateController.text = plate;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.couldNotReadPlate)),
      );
    }
  }

  Future<void> _save() async {
    final plate = _plateController.text.trim();
    if (plate.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.plateRequired)),
      );
      return;
    }

    final provider = context.read<VehicleProvider>();
    final nickname = _nicknameController.text.trim();
    final make     = _makeController.text.trim();

    bool ok;
    if (_isEditing) {
      ok = await provider.updateVehicle(
        id:           widget.existing!.id,
        plateNumber:  plate,
        nickname:     nickname.isEmpty ? null : nickname,
        vehicleType:  _selectedType,
        makeAndModel: make.isEmpty ? null : make,
        isDefault:    _setAsDefault,
        autoPay:      _autoPay,
      );
    } else {
      ok = await provider.addVehicle(
        plateNumber:  plate,
        nickname:     nickname.isEmpty ? null : nickname,
        vehicleType:  _selectedType,
        makeAndModel: make.isEmpty ? null : make,
        isDefault:    _setAsDefault,
        autoPay:      _autoPay,
      );
    }

    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? AppLocalizations.of(context)!.failedToSaveVehicle)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark        = Theme.of(context).brightness == Brightness.dark;
    final l10n          = AppLocalizations.of(context)!;
    final textPrimary   = isDark ? AppColors.textPrimaryDark   : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final isLoading     = context.watch<VehicleProvider>().isLoading;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(Icons.arrow_back, color: textPrimary),
                  ),
                  Text(
                    _isEditing ? l10n.editVehicle : l10n.addVehicleTitle,
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Text(
                      l10n.cancel,
                      style: const TextStyle(
                        color: AppColors.accentGreen,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    Center(
                      child: Text(
                        l10n.addVehicleSubtitle,
                        style: TextStyle(color: textSecondary, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const SizedBox(height: 24),

                    _FieldLabel(l10n.licensePlate, textColor: textPrimary),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _plateController,
                        decoration: InputDecoration(
                          hintText: l10n.licensePlateHint,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          suffixIconConstraints:
                              const BoxConstraints(minHeight: 48, minWidth: 0),
                          suffixIcon: _isScanning
                              ? const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                )
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: Icon(Icons.camera_alt,
                                          size: 20, color: textSecondary),
                                      onPressed: _scanPlate,
                                      padding: EdgeInsets.zero,
                                    ),
                                    IconButton(
                                      icon: Icon(Icons.close,
                                          size: 14, color: textSecondary.withValues(alpha: 0.45)),
                                      onPressed: () => _plateController.clear(),
                                      padding: EdgeInsets.zero,
                                    ),
                                    const SizedBox(width: 4),
                                  ],
                                ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        _FieldLabel(l10n.vehicleNickname, textColor: textPrimary),
                        const SizedBox(width: 6),
                        Text(l10n.optional,
                            style:
                                TextStyle(color: textSecondary, fontSize: 13)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _GradientFieldBox(
                      child: TextFormField(
                        controller: _nicknameController,
                        decoration: InputDecoration(
                          hintText: l10n.vehicleNicknameHint,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: true,
                          fillColor: Colors.transparent,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          suffixIcon: IconButton(
                            icon: Icon(Icons.close,
                                size: 14, color: textSecondary.withValues(alpha: 0.45)),
                            onPressed: () => _nicknameController.clear(),
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.vehicleType, textColor: textPrimary),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                      children: _vehicleTypes.map((type) {
                        final isSelected = _selectedType == type['value'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _selectedType       = type['value'] as String;
                              _typeUserOverridden = true;
                            }),
                            child: _GradientChipBox(
                              isSelected: isSelected,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.purple
                                      : const Color(0x4D000011),
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      type['icon'] as IconData,
                                      size: 16,
                                      color: isSelected
                                          ? Colors.white
                                          : textSecondary,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      _typeLabel(type['value'] as String, l10n),
                                      style: TextStyle(
                                        color: isSelected
                                            ? Colors.white
                                            : textSecondary,
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                      ),
                    ),

                    const SizedBox(height: 20),

                    _FieldLabel(l10n.makeAndModel, textColor: textPrimary),
                    const SizedBox(height: 8),
                    RawAutocomplete<String>(
                      textEditingController: _makeController,
                      focusNode: _makeFocusNode,
                      optionsBuilder: (TextEditingValue value) =>
                          CarSearchService.getSuggestions(value.text),
                      onSelected: (String selection) {
                        _makeController.text = selection;
                        _detectEV(selection);
                        if (!_typeUserOverridden) {
                          final detected =
                              CarSearchService.getVehicleType(selection);
                          if (detected != null) {
                            setState(() => _selectedType = detected);
                          }
                        }
                      },
                      fieldViewBuilder:
                          (context, controller, focusNode, onFieldSubmitted) {
                        return _GradientFieldBox(
                          child: TextFormField(
                            controller: controller,
                            focusNode: focusNode,
                            onChanged: _detectEV,
                            onFieldSubmitted: (_) => onFieldSubmitted(),
                            decoration: InputDecoration(
                              hintText: l10n.makeHint,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              filled: true,
                              fillColor: Colors.transparent,
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              suffixIcon: IconButton(
                                icon: Icon(Icons.close,
                                    size: 14, color: textSecondary.withValues(alpha: 0.45)),
                                onPressed: () {
                                  _makeController.clear();
                                  _detectEV('');
                                },
                                padding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        );
                      },
                      optionsViewBuilder: (context, onSelected, options) {
                        return Align(
                          alignment: Alignment.topLeft,
                          child: Material(
                            color: Colors.transparent,
                            child: Container(
                              constraints:
                                  const BoxConstraints(maxHeight: 240),
                              margin: const EdgeInsets.only(top: 4),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF1A0A2E)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.15),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ListView.separated(
                                padding: EdgeInsets.zero,
                                shrinkWrap: true,
                                itemCount: options.length,
                                separatorBuilder: (context, index) => Divider(
                                  height: 1,
                                  color: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                                itemBuilder: (context, index) {
                                  final option = options.elementAt(index);
                                  return InkWell(
                                    borderRadius: BorderRadius.circular(12),
                                    onTap: () => onSelected(option),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                      child: Row(
                                        children: [
                                          Icon(Icons.directions_car_outlined,
                                              size: 16,
                                              color: textSecondary),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Text(
                                              option,
                                              style: TextStyle(
                                                  color: textPrimary,
                                                  fontSize: 14),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0x4D000011),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: _isEV
                                  ? const Color(0xFF22C55E).withOpacity(0.15)
                                  : AppColors.purple.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.electric_bolt,
                              color: _isEV
                                  ? const Color(0xFF22C55E)
                                  : textSecondary,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(l10n.electricVehicle,
                                    style: TextStyle(
                                        color: textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500)),
                                const SizedBox(height: 2),
                                Text(
                                  _isEV
                                      ? l10n.evAutoDetected
                                      : l10n.evNotDetected,
                                  style: TextStyle(
                                    color: _isEV
                                        ? const Color(0xFF22C55E)
                                        : textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _isEV,
                            onChanged: (v) => setState(() {
                              _isEV = v;
                              _evUserOverridden = true;
                            }),
                            activeColor: Colors.white,
                            activeTrackColor: const Color(0xFF22C55E),
                            inactiveThumbColor: Colors.white,
                            inactiveTrackColor: isDark
                                ? AppColors.borderDark
                                : AppColors.borderLight,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 4),

                    _ToggleRow(
                      isDark: isDark,
                      label: l10n.setAsDefault,
                      value: _setAsDefault,
                      onChanged: (v) => setState(() => _setAsDefault = v),
                      textColor: textPrimary,
                    ),

                    const SizedBox(height: 4),

                    Container(
                      decoration: const BoxDecoration(
                        color: Color(0x4D000011),
                        borderRadius: BorderRadius.all(Radius.circular(14)),
                      ),
                      child: Column(
                        children: [
                          _ToggleRow(
                            isDark: isDark,
                            label: l10n.autoPaySettings,
                            value: _autoPay,
                            onChanged: (v) => setState(() => _autoPay = v),
                            textColor: textPrimary,
                            bold: true,
                            noBorder: true,
                          ),
                          if (_autoPay)
                            Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(16, 0, 16, 14),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppColors.backgroundDark
                                      : AppColors.backgroundLight,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isDark
                                        ? AppColors.borderDark
                                        : AppColors.borderLight,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1A1A7E),
                                        borderRadius:
                                            BorderRadius.circular(4),
                                      ),
                                      child: const Text('VISA',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800)),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text('Visa ending in 4242',
                                              style: TextStyle(
                                                  color: textPrimary,
                                                  fontSize: 13,
                                                  fontWeight:
                                                      FontWeight.w500)),
                                          const SizedBox(height: 2),
                                          Text(l10n.defaultLabel,
                                              style: const TextStyle(
                                                  color:
                                                      AppColors.accentGreen,
                                                  fontSize: 11,
                                                  fontWeight:
                                                      FontWeight.w500)),
                                        ],
                                      ),
                                    ),
                                    Text(l10n.change,
                                        style: const TextStyle(
                                            color: AppColors.purple,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _save,
                        child: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : Text(_isEditing
                                ? l10n.updateVehicle
                                : l10n.saveVehicle),
                      ),
                    ),

                    if (_isEditing) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: TextButton(
                          onPressed: isLoading ? null : _confirmDelete,
                          child: Text(
                            l10n.deleteVehicle,
                            style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _typeLabel(String value, AppLocalizations l10n) => switch (value) {
  'SEDAN'      => l10n.vehicleTypeSedan,
  'SUV'        => l10n.vehicleTypeSUV,
  'TRUCK'      => l10n.vehicleTypeTruck,
  'MOTORCYCLE' => l10n.vehicleTypeMotorcycle,
  _            => value,
};

class _FieldLabel extends StatelessWidget {
  final String text;
  final Color textColor;
  const _FieldLabel(this.text, {required this.textColor});

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: TextStyle(
            fontWeight: FontWeight.w600, fontSize: 14, color: textColor),
      );
}

class _ToggleRow extends StatelessWidget {
  final bool isDark;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Color textColor;
  final bool bold;
  final bool noBorder;

  const _ToggleRow({
    required this.isDark,
    required this.label,
    required this.value,
    required this.onChanged,
    required this.textColor,
    this.bold = false,
    this.noBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x4D000011),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: textColor,
                  fontSize: 15,
                  fontWeight:
                      bold ? FontWeight.w600 : FontWeight.w500)),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.white,
            activeTrackColor: AppColors.purple,
            inactiveThumbColor: Colors.white,
            inactiveTrackColor:
                isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ],
      ),
    );
  }
}

class _GradientFieldBox extends StatelessWidget {
  final Widget child;
  const _GradientFieldBox({required this.child});
  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF7D39EB), Color(0xFF0A0320)],
  );

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _GradientBorderPainter(
          gradient: _gradient, borderWidth: 1.5, radius: 12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0x4D000011),
          borderRadius: BorderRadius.circular(12),
        ),
        child: child,
      ),
    );
  }
}

class _GradientChipBox extends StatelessWidget {
  final bool isSelected;
  final Widget child;
  const _GradientChipBox({required this.isSelected, required this.child});

  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF7D39EB), Color(0xFF0A0320)],
  );

  @override
  Widget build(BuildContext context) {
    if (isSelected) return child;
    return CustomPaint(
      painter: _GradientBorderPainter(
          gradient: _gradient, borderWidth: 1.5, radius: 24),
      child: child,
    );
  }
}

class _GradientBorderPainter extends CustomPainter {
  final LinearGradient gradient;
  final double borderWidth;
  final double radius;

  _GradientBorderPainter(
      {required this.gradient,
      required this.borderWidth,
      required this.radius});

  @override
  void paint(Canvas canvas, Size size) {
    final rect  = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    final paint = Paint()
      ..shader    = gradient.createShader(rect)
      ..strokeWidth = borderWidth
      ..style     = PaintingStyle.stroke;
    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter old) =>
      old.gradient != gradient ||
      old.borderWidth != borderWidth ||
      old.radius != radius;
}
