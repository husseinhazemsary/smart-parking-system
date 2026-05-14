import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../models/vehicle_model.dart';
import '../../l10n/app_localizations.dart';
import 'add_vehicle_screen.dart';

class MyVehiclesScreen extends StatelessWidget {
  const MyVehiclesScreen({super.key});

  Future<void> _confirmDelete(
      BuildContext context, VehicleModel vehicle) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.deleteVehicle),
        content: Text(l10n.removeVehicleConfirm(vehicle.displayName)),
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
    if (confirmed == true && context.mounted) {
      final provider = context.read<VehicleProvider>();
      final ok = await provider.deleteVehicle(vehicle.id);
      if (!ok && context.mounted) {
        final l10n2 = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? l10n2.failedToDeleteVehicle)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    final bgColor =
        isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor =
        isDark ? AppColors.borderDark : AppColors.borderLight;
    final surfaceColor =
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    final vehicleProvider = context.watch<VehicleProvider>();

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child:
                          Icon(Icons.arrow_back, size: 20, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    l10n.myVehiclesTitle,
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: vehicleProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: vehicleProvider.fetchVehicles,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding:
                            const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (vehicleProvider.error != null)
                              Padding(
                                padding:
                                    const EdgeInsets.only(bottom: 12),
                                child: Text(
                                  vehicleProvider.error!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            const SizedBox(height: 4),
                            Container(
                              decoration: BoxDecoration(
                                color: surfaceColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: borderColor),
                              ),
                              child: Column(
                                children: [
                                  ...vehicleProvider.vehicles
                                      .map((vehicle) => Column(
                                            children: [
                                              _VehicleRow(
                                                isDark: isDark,
                                                vehicle: vehicle,
                                                onTap: () =>
                                                    Navigator.of(context)
                                                        .push(
                                                  MaterialPageRoute(
                                                    builder: (_) =>
                                                        AddVehicleScreen(
                                                            existing: vehicle),
                                                  ),
                                                ),
                                                onDelete: () =>
                                                    _confirmDelete(
                                                        context, vehicle),
                                              ),
                                              Divider(
                                                  height: 1,
                                                  color: borderColor,
                                                  indent: 64),
                                            ],
                                          )),
                                  GestureDetector(
                                    onTap: () => Navigator.of(context).push(
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const AddVehicleScreen()),
                                    ),
                                    behavior: HitTestBehavior.opaque,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 14),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 40,
                                            height: 40,
                                            decoration: BoxDecoration(
                                              border: Border.all(
                                                  color: isDark
                                                      ? AppColors.accentGreen
                                                      : const Color(
                                                          0xFF16A34A),
                                                  width: 1.5),
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                            child: Icon(
                                              Icons.add,
                                              color: isDark
                                                  ? AppColors.accentGreen
                                                  : const Color(0xFF16A34A),
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(
                                            l10n.addVehicle,
                                            style: TextStyle(
                                              color: isDark
                                                  ? AppColors.accentGreen
                                                  : const Color(0xFF16A34A),
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              l10n.vehicleDefaultHint,
                              style: TextStyle(
                                  fontSize: 12,
                                  color: textSecondary,
                                  height: 1.5),
                            ),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleRow extends StatelessWidget {
  final bool isDark;
  final VehicleModel vehicle;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _VehicleRow({
    required this.isDark,
    required this.vehicle,
    required this.onTap,
    required this.onDelete,
  });

  static IconData _typeIcon(String type) => switch (type) {
        'SUV'        => Icons.directions_car_filled,
        'TRUCK'      => Icons.local_shipping,
        'MOTORCYCLE' => Icons.two_wheeler,
        _            => Icons.directions_car_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textPrimary =
        isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
        isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final typeLabel = vehicle.vehicleType[0] +
        vehicle.vehicleType.substring(1).toLowerCase();

    // Show make & model in subtitle only when it isn't already the display name
    final showMakeInSubtitle = vehicle.makeAndModel?.isNotEmpty == true &&
        vehicle.nickname?.isNotEmpty == true;
    final subtitleParts = [
      vehicle.plateNumber,
      typeLabel,
      if (showMakeInSubtitle) vehicle.makeAndModel!,
    ];

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.purple.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_typeIcon(vehicle.vehicleType),
                  color: AppColors.purple, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        vehicle.displayName,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: textPrimary,
                        ),
                      ),
                      if (vehicle.isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color:
                                AppColors.purple.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            l10n.defaultLabel,
                            style: const TextStyle(
                              color: AppColors.purple,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitleParts.join('  ·  '),
                    style:
                        TextStyle(fontSize: 12, color: textSecondary),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline,
                  size: 18, color: Colors.redAccent),
              onPressed: onDelete,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, size: 18, color: textSecondary),
          ],
        ),
      ),
    );
  }
}
