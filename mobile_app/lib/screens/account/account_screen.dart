// Account screen — main profile page showing vehicles, preferences, support and legal sections.
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/user_provider.dart';
import '../../l10n/app_localizations.dart';
import '../../models/vehicle_model.dart';
import '../../providers/vehicle_provider.dart';
import '../account/add_vehicle_screen.dart';
import '../account/edit_profile_screen.dart';
import '../account/change_password_screen.dart';
import '../auth/login_screen.dart';
import 'settings_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _notificationsEnabled = true;
  bool _isAccessible = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VehicleProvider>().fetchVehicles();
    });
  }

  Future<void> _onAccessibleToggle(bool newValue) async {
    if (!newValue) {
      setState(() => _isAccessible = false);
      return;
    }
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.accessibleParkingDialogTitle),
        content: Text(l10n.accessibleParkingDialogBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              l10n.accessibleParkingConfirm,
              style: const TextStyle(color: AppColors.purple, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      setState(() => _isAccessible = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
    final l10n = AppLocalizations.of(context)!;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    // Semi-transparent dark tint on status bar so icons stay visible over the purple header.
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.black.withOpacity(0.3),
      statusBarIconBrightness: Brightness.light,
    ));

    return Directionality(
      textDirection: localeProvider.isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor:
        isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: Stack(
          children: [

            SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // Purple hero header with avatar, name, stats bar and settings button.
                  _ProfileHeader(
                    isDark: isDark,
                    isAccessible: _isAccessible,
                    onSettings: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => const SettingsScreen()),
                    ),
                  ),

                  // Push content down to clear the stats bar which overhangs the header bottom edge.
                  const SizedBox(height: _ProfileHeader._statsHeight / 2 + 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.myVehicles,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildVehiclesCard(context, isDark),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.preferences,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _LanguageRow(isDark: isDark),
                              _RowDivider(isDark: isDark),
                              _PreferenceRow(
                                isDark: isDark,
                                icon: Icons.notifications_outlined,
                                label: l10n.notifications,
                                trailing: Switch(
                                  value: _notificationsEnabled,
                                  onChanged: (v) =>
                                      setState(() => _notificationsEnabled = v),
                                  activeColor: Colors.white,
                                  activeTrackColor: AppColors.purple,
                                  inactiveThumbColor: Colors.white,
                                  inactiveTrackColor: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                              ),
                              _RowDivider(isDark: isDark),
                              _PreferenceRow(
                                isDark: isDark,
                                icon: Icons.nightlight_outlined,
                                label: l10n.darkMode,
                                trailing: Switch(
                                  value: themeProvider.isDark,
                                  onChanged: (_) => themeProvider.toggleTheme(),
                                  activeColor: Colors.white,
                                  activeTrackColor: AppColors.purple,
                                  inactiveThumbColor: Colors.white,
                                  inactiveTrackColor: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                              ),
                              _RowDivider(isDark: isDark),
                              _PreferenceRow(
                                isDark: isDark,
                                icon: Icons.accessible_outlined,
                                label: l10n.accessibleParking,
                                trailing: Switch(
                                  value: _isAccessible,
                                  onChanged: _onAccessibleToggle,
                                  activeColor: Colors.white,
                                  activeTrackColor: AppColors.purple,
                                  inactiveThumbColor: Colors.white,
                                  inactiveTrackColor: isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight,
                                ),
                              ),
                              if (_isAccessible)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: AppColors.purple.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                          color: AppColors.purple.withOpacity(0.2)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.info_outline,
                                            color: AppColors.purple, size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            l10n.accessibleParkingHint,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isDark
                                                  ? AppColors.textSecondaryDark
                                                  : AppColors.textSecondaryLight,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.support,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.help_outline,
                                  label: l10n.helpCenter,
                                  onTap: () => _showHelpCenterSheet(context, isDark)),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.chat_bubble_outline,
                                  label: l10n.contactUs,
                                  onTap: () => _showContactSheet(context, isDark)),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.star_outline,
                                  label: l10n.rateTheApp,
                                  onTap: () => _showRateAppSheet(context, isDark)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.legal,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _SectionCard(
                          isDark: isDark,
                          child: Column(
                            children: [
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.privacy_tip_outlined,
                                  label: l10n.privacyPolicy,
                                  onTap: () => _showPrivacyPolicySheet(context, isDark)),
                              _RowDivider(isDark: isDark),
                              _NavRow(
                                  isDark: isDark,
                                  icon: Icons.description_outlined,
                                  label: l10n.termsOfService,
                                  onTap: () => _showTermsSheet(context, isDark)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: GestureDetector(
                      onTap: () => _confirmLogout(context),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.red.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.logout, color: Colors.redAccent, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              l10n.logOut,
                              style: const TextStyle(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'EzRakna v1.0.0',
                      style: TextStyle(color: textSecondary, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),

          ],
        ),
      ),
    );
  }

  Widget _buildVehiclesCard(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final vehicleProvider = context.watch<VehicleProvider>();
    final vehicles = vehicleProvider.vehicles;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return _SectionCard(
      isDark: isDark,
      child: Column(
        children: [
          if (vehicleProvider.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: CircularProgressIndicator()),
            )
          else
            ...vehicles.map((v) => Column(
                  children: [
                    _VehicleRow(
                      isDark: isDark,
                      vehicle: v,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AddVehicleScreen(existing: v),
                        ),
                      ),
                    ),
                    Divider(color: borderColor, height: 1),
                  ],
                )),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AddVehicleScreen()),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      border: Border.all(
                          color: isDark
                              ? AppColors.accentGreen
                              : const Color(0xFF16A34A),
                          width: 1.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.add,
                        color: isDark
                            ? AppColors.accentGreen
                            : const Color(0xFF16A34A),
                        size: 18),
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
    );
  }

  // Opens a URL in the device's default external browser or app.
  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open $url')),
      );
    }
  }

  // Bottom sheet listing email, phone and WhatsApp contact options.
  // Uses isScrollControlled + viewPadding so content clears the Android nav bar.
  void _showContactSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.contactUs,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 6),
              Text(l10n.contactUsSubheading,
                  style: TextStyle(fontSize: 14, color: subColor)),
              const SizedBox(height: 20),
              _ContactOption(
                isDark: isDark,
                icon: Icons.email_outlined,
                label: l10n.emailSupport,
                subtitle: 'support@ezrakna.com',
                onTap: () => _launchUrl('mailto:support@ezrakna.com'),
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.phone_outlined,
                label: l10n.callUs,
                subtitle: '+20 100 000 0000',
                onTap: () => _launchUrl('tel:+201000000000'),
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.chat_outlined,
                label: l10n.whatsapp,
                subtitle: l10n.chatOnWhatsApp,
                onTap: () => _launchUrl('https://wa.me/201000000000'),
              ),
            ],
          ),
        );
      },
    );
  }

  // Bottom sheet for Help Center — links to the website, email and live chat.
  void _showHelpCenterSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.helpCenter,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 6),
              Text(l10n.helpCenterSubheading,
                  style: TextStyle(fontSize: 14, color: subColor)),
              const SizedBox(height: 20),
              _ContactOption(
                isDark: isDark,
                icon: Icons.language_outlined,
                label: l10n.visitHelpCenter,
                subtitle: 'ezrakna.com/help',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('https://ezrakna.com/help');
                },
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.email_outlined,
                label: l10n.emailSupport,
                subtitle: 'support@ezrakna.com',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('mailto:support@ezrakna.com');
                },
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.chat_bubble_outline,
                label: l10n.liveChat,
                subtitle: l10n.liveChatSubtitle,
                onTap: () {
                  Navigator.pop(context);
                  _showContactSheet(context, isDark);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Bottom sheet prompting the user to rate on Play Store or send feedback.
  void _showRateAppSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.enjoyingEzRakna,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 6),
              Text(l10n.feedbackHelpsUs,
                  style: TextStyle(fontSize: 14, color: subColor)),
              const SizedBox(height: 20),
              _ContactOption(
                isDark: isDark,
                icon: Icons.star_outline,
                label: l10n.rateOnGooglePlay,
                subtitle: l10n.rateOnPlayStoreSubtitle,
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('https://play.google.com/store/apps/details?id=com.ezrakna.app');
                },
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.chat_outlined,
                label: l10n.sendFeedback,
                subtitle: l10n.sendFeedbackSubtitle,
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('mailto:feedback@ezrakna.com');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Bottom sheet for Privacy Policy — opens the full policy page or privacy email.
  void _showPrivacyPolicySheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.privacyPolicy,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 6),
              Text(l10n.privacyPolicySheetSubtitle,
                  style: TextStyle(fontSize: 14, color: subColor)),
              const SizedBox(height: 20),
              _ContactOption(
                isDark: isDark,
                icon: Icons.privacy_tip_outlined,
                label: l10n.readFullPrivacyPolicy,
                subtitle: 'ezrakna.com/privacy',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('https://ezrakna.com/privacy');
                },
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.email_outlined,
                label: l10n.privacyInquiries,
                subtitle: 'privacy@ezrakna.com',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('mailto:privacy@ezrakna.com');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Bottom sheet for Terms of Service — opens the full terms page or legal email.
  void _showTermsSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.termsOfService,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 6),
              Text(l10n.termsSheetSubtitle,
                  style: TextStyle(fontSize: 14, color: subColor)),
              const SizedBox(height: 20),
              _ContactOption(
                isDark: isDark,
                icon: Icons.description_outlined,
                label: l10n.readFullTerms,
                subtitle: 'ezrakna.com/terms',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('https://ezrakna.com/terms');
                },
              ),
              const SizedBox(height: 12),
              _ContactOption(
                isDark: isDark,
                icon: Icons.email_outlined,
                label: l10n.legalInquiries,
                subtitle: 'legal@ezrakna.com',
                onTap: () {
                  Navigator.pop(context);
                  _launchUrl('mailto:legal@ezrakna.com');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Bottom sheet for account settings: edit profile, password, payments, delete account.
  void _showSettingsSheet(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final bottomPadding = MediaQuery.of(ctx).viewPadding.bottom;
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, 36 + bottomPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(l10n.settings,
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700, color: textColor)),
              const SizedBox(height: 20),
              _SettingsOption(
                isDark: isDark,
                icon: Icons.person_outline,
                label: l10n.editProfile,
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),
              _SettingsOption(
                isDark: isDark,
                icon: Icons.lock_outline,
                label: l10n.changePassword,
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),
              _SettingsOption(
                isDark: isDark,
                icon: Icons.payment_outlined,
                label: l10n.paymentMethods,
                onTap: () {
                  Navigator.pop(context);

                },
              ),
              const SizedBox(height: 12),
              _SettingsOption(
                isDark: isDark,
                icon: Icons.delete_outline,
                label: l10n.deleteAccount,
                labelColor: Colors.redAccent,
                onTap: () {
                  Navigator.pop(context);
                  _confirmDeleteAccount(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Confirmation dialog before logging out — navigates to login and clears the stack.
  void _confirmLogout(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor:
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          l10n.logOutConfirmTitle,
          style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight),
        ),
        content: Text(
          l10n.logOutConfirmMessage,
          style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(l10n.logOut,
                style: const TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // Confirmation dialog for permanent account deletion — action is irreversible.
  void _confirmDeleteAccount(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor:
        isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.deleteAccountTitle,
            style: const TextStyle(
                color: Colors.redAccent, fontWeight: FontWeight.w700)),
        content: Text(
          l10n.deleteAccountMessage,
          style: TextStyle(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: TextStyle(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);

            },
            child: Text(l10n.delete,
                style: const TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// Tappable row used inside contact/help bottom sheets — icon, label, subtitle, chevron.
class _ContactOption extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  const _ContactOption({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.purple, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight)),
                ],
              ),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// Tappable row used inside the settings bottom sheet.
class _SettingsOption extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final Color? labelColor;
  final VoidCallback onTap;
  const _SettingsOption({
    required this.isDark,
    required this.icon,
    required this.label,
    this.labelColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = labelColor ??
        (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: textColor, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: textColor)),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// Full-width purple header with blurred glass stats bar that overhangs the bottom edge.
class _ProfileHeader extends StatelessWidget {
  final bool isDark;
  final bool isAccessible;
  final VoidCallback onSettings;
  const _ProfileHeader({
    required this.isDark,
    required this.isAccessible,
    required this.onSettings,
  });

  static const double _statsHeight = 76.0;

  static const _months = [
    '', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  String _formatMemberSince(String? createdAt) {
    if (createdAt == null || createdAt.isEmpty) return '';
    final dt = DateTime.tryParse(createdAt);
    if (dt == null) return '';
    return 'MEMBER SINCE ${_months[dt.month]} ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final topPadding = MediaQuery.of(context).padding.top;
    final auth = context.watch<AuthProvider>();
    final userProfile = context.watch<UserProvider>().profile;

    final displayName = auth.userName ?? userProfile?.fullName ?? '';
    final displayEmail = auth.userEmail ?? userProfile?.email ?? '';
    final memberSince = _formatMemberSince(userProfile?.createdAt);

    return Stack(
      clipBehavior: Clip.none,
      children: [

        Container(
          width: double.infinity,
          padding: EdgeInsets.only(bottom: _statsHeight / 2),
          decoration: const BoxDecoration(
            color: AppColors.purple,
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(32),
              bottomRight: Radius.circular(32),
            ),
          ),
          child: Column(
            children: [

              SizedBox(height: topPadding),

              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.profile,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: onSettings,
                      child: const Icon(Icons.settings_outlined,
                          color: Colors.white, size: 24),
                    ),
                  ],
                ),
              ),

              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child:
                    const Icon(Icons.person, size: 48, color: Colors.white),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: Colors.blue.shade400,
                        shape: BoxShape.circle,
                        border:
                        Border.all(color: AppColors.purple, width: 2),
                      ),
                      child: const Icon(Icons.edit,
                          size: 13, color: Colors.white),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              Text(
                displayName,
                style: const TextStyle(
                  color: AppColors.accentGreen,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                displayEmail,
                style: TextStyle(
                    color: Colors.white.withOpacity(0.85), fontSize: 13),
              ),
              const SizedBox(height: 3),
              Text(
                memberSince,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 11,
                  letterSpacing: 1.0,
                  fontWeight: FontWeight.w500,
                ),
              ),

              if (isAccessible) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.accessible, color: Colors.white, size: 14),
                      const SizedBox(width: 5),
                      Text(
                        l10n.accessibleParking,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 20),
            ],
          ),
        ),

        Positioned(
          bottom: -(_statsHeight / 2),
          left: 20,
          right: 20,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
              child: Container(
                height: _statsHeight,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppColors.accentGreen.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    _StatItem(value: '42', label: l10n.bookings, isDark: isDark),
                    _StatDivider(isDark: isDark),
                    _StatItem(value: 'EGP 350', label: l10n.spent, isDark: isDark),
                    _StatDivider(isDark: isDark),
                    _StatItem(value: '128h', label: l10n.parked, isDark: isDark),
                  ],
                ),
              ),
            ),
          ),
        ),

        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: SizedBox(height: _statsHeight / 2),
        ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final bool isDark;
  const _StatItem(
      {required this.value, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  final bool isDark;
  const _StatDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 36,
      color: Colors.white.withOpacity(0.25),
    );
  }
}

// Language preference row with animated EN/AR toggle pill.
class _LanguageRow extends StatelessWidget {
  final bool isDark;
  const _LanguageRow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeProvider = context.watch<LocaleProvider>();
    final isArabic = localeProvider.isArabic;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(Icons.language, color: textPrimary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.language,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: textPrimary)),
                const SizedBox(height: 2),
                Text(isArabic ? l10n.languageCurrentAr : l10n.languageCurrent,
                    style: TextStyle(fontSize: 12, color: textSecondary)),
              ],
            ),
          ),
          Container(
            height: 32,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.borderDark
                  : const Color(0xFFEEEEF5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: isArabic ? localeProvider.toggleLocale : null,
                  child: _LangOption(label: 'EN', isActive: !isArabic, isDark: isDark),
                ),
                GestureDetector(
                  onTap: isArabic ? null : localeProvider.toggleLocale,
                  child: _LangOption(label: 'AR', isActive: isArabic, isDark: isDark),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LangOption extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  const _LangOption(
      {required this.label, required this.isActive, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 40,
      height: 32,
      decoration: BoxDecoration(
        color: isActive ? AppColors.purple : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          color: isActive
              ? Colors.white
              : isDark
              ? AppColors.textSecondaryDark
              : AppColors.textSecondaryLight,
          fontSize: 13,
          fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
    );
  }
}

// Displays a single saved vehicle with icon, name, plate and a chevron.
class _VehicleRow extends StatelessWidget {
  final bool isDark;
  final VehicleModel vehicle;
  final VoidCallback onTap;
  const _VehicleRow({
    required this.isDark,
    required this.vehicle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final typeLabel = vehicle.vehicleType[0] +
        vehicle.vehicleType.substring(1).toLowerCase();

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.purple.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.directions_car_outlined,
                  color: AppColors.purple, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(vehicle.displayName,
                          style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: isDark
                                  ? AppColors.textPrimaryDark
                                  : AppColors.textPrimaryLight)),
                      if (vehicle.isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.purple.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(l10n.defaultLabel,
                              style: const TextStyle(
                                  color: AppColors.purple,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text('${vehicle.plateNumber}  ·  $typeLabel',
                      style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight)),
                ],
              ),
            ),
            Icon(Icons.chevron_right,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// Card container used for every settings section.
// Dark mode: semi-transparent dark fill with gradient border.
// Light mode: white fill with a subtle purple gradient border.
class _SectionCard extends StatelessWidget {
  final bool isDark;
  final Widget child;
  const _SectionCard({required this.isDark, required this.child});

  @override
  Widget build(BuildContext context) {
    const radius = 16.0;
    const borderWidth = 1.5;

    final cardColor = isDark ? const Color(0x4D000011) : Colors.white;
    final gradient = isDark
        ? const LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [Color(0xFF0A0320), Color(0xFF7D39EB)],
    )
        : const LinearGradient(
      begin: Alignment.centerLeft,
      end: Alignment.centerRight,
      colors: [Color(0xFFE9E2FA), Color(0xFF7D39EB)],
    );

    return CustomPaint(
      painter: _GradientBorderPainter(
        gradient: gradient,
        borderWidth: borderWidth,
        radius: radius,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(radius),
        ),
        child: child,
      ),
    );
  }
}

// Custom painter that strokes a rounded-rect border using a LinearGradient shader.
// Necessary because BoxDecoration does not support gradient borders natively.
class _GradientBorderPainter extends CustomPainter {
  final LinearGradient gradient;
  final double borderWidth;
  final double radius;

  const _GradientBorderPainter({
    required this.gradient,
    required this.borderWidth,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    final paint = Paint()
      ..shader = gradient.createShader(rect)
      ..strokeWidth = borderWidth
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter old) =>
      old.gradient != gradient ||
          old.borderWidth != borderWidth ||
          old.radius != radius;
}

// Generic preference row with an icon, label and an arbitrary trailing widget (e.g. Switch).
class _PreferenceRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final Widget trailing;
  final VoidCallback? onTap;

  const _PreferenceRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight)),
            ),
            trailing,
          ],
        ),
      ),
    );
  }
}

// Tappable row with icon, label and a chevron — used for navigable settings items.
class _NavRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _NavRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight)),
            ),
            Icon(Icons.chevron_right,
                size: 18,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

// Thin divider with a left indent to align with the row icon column.
class _RowDivider extends StatelessWidget {
  final bool isDark;
  const _RowDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      indent: 50,
      color: isDark ? AppColors.borderDark : AppColors.borderLight,
    );
  }
}