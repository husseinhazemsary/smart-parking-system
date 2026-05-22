import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_colors.dart';
import '../models/vehicle_model.dart';
import '../providers/vehicle_provider.dart';
import '../l10n/app_localizations.dart';
import '../screens/account/add_vehicle_screen.dart';

/// Shows the appropriate prompt after a default vehicle is deleted.
/// - Has remaining vehicles → bottom sheet to pick a new default (+ add option)
/// - No remaining vehicles → dialog to add one
Future<void> promptNewDefault(BuildContext context) async {
  final l10n      = AppLocalizations.of(context)!;
  final provider  = context.read<VehicleProvider>();
  final remaining = provider.vehicles;

  if (remaining.isEmpty) {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.chooseNewDefaultTitle),
        content: Text(l10n.noVehiclesAfterDelete),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.later),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AddVehicleScreen()),
              );
            },
            child: Text(l10n.addVehicle,
                style: const TextStyle(color: AppColors.accentGreen)),
          ),
        ],
      ),
    );
  } else {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => PickDefaultVehicleSheet(
        vehicles: remaining,
        onPicked: (id) async {
          Navigator.pop(ctx);
          await provider.setDefaultVehicle(id);
        },
        onAddVehicle: () {
          Navigator.pop(ctx);
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AddVehicleScreen()),
          );
        },
      ),
    );
  }
}

class PickDefaultVehicleSheet extends StatelessWidget {
  final List<VehicleModel> vehicles;
  final Future<void> Function(String id) onPicked;
  final VoidCallback onAddVehicle;

  const PickDefaultVehicleSheet({
    super.key,
    required this.vehicles,
    required this.onPicked,
    required this.onAddVehicle,
  });

  @override
  Widget build(BuildContext context) {
    final l10n          = AppLocalizations.of(context)!;
    final isDark        = Theme.of(context).brightness == Brightness.dark;
    final textPrimary   = isDark ? AppColors.textPrimaryDark   : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor   = isDark ? AppColors.borderDark        : AppColors.borderLight;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.chooseNewDefaultTitle,
              style: TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w700, color: textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              l10n.chooseNewDefaultSubtitle,
              style: TextStyle(fontSize: 13, color: textSecondary),
            ),
            const SizedBox(height: 16),
            ...vehicles.map((v) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.purple.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.directions_car_outlined,
                        color: AppColors.purple, size: 20),
                  ),
                  title: Text(
                    v.displayName,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: textPrimary),
                  ),
                  subtitle: Text(
                    v.displayPlateNumber,
                    style: TextStyle(fontSize: 12, color: textSecondary),
                    textDirection: TextDirection.ltr,
                  ),
                  trailing:
                      Icon(Icons.check_circle_outline, color: textSecondary),
                  onTap: () => onPicked(v.id),
                )),
            Divider(height: 1, color: borderColor),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.accentGreen, width: 1.5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.add,
                    color: AppColors.accentGreen, size: 20),
              ),
              title: Text(
                l10n.addVehicle,
                style: const TextStyle(
                    color: AppColors.accentGreen,
                    fontWeight: FontWeight.w600,
                    fontSize: 14),
              ),
              onTap: onAddVehicle,
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
