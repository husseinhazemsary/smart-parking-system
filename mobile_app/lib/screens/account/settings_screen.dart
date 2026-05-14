// Settings screen — full-page settings with sections for account, appearance,
// notifications, auto-pay, privacy/security, support/legal and danger zone.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/auth_provider.dart';
import '../../l10n/app_localizations.dart';
import '../auth/login_screen.dart';
import '../account/edit_profile_screen.dart';
import '../account/change_password_screen.dart';
import '../account/my_vehicles_screen.dart';
import '../account/payment_methods_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {

  // Notification preference toggles — each maps to a future API preference key.
  bool _pushNotifications = true;
  bool _emailNotifications = false;
  bool _sessionReminders = true;
  bool _promoAlerts = false;
  bool _parkingExpiry = true;

  // Privacy toggles — biometric and location require OS-level permission requests.
  bool _locationAlways = false;
  bool _shareAnalytics = true;
  bool _biometricLogin = false;

  // Auto-pay toggles — disabling autoPayEnabled hides the spending limit row.
  bool _autoPayEnabled = true;
  bool _receiptByEmail = true;

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
    final l10n = AppLocalizations.of(context)!;
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final bgColor =
    isDark ? AppColors.backgroundDark : AppColors.backgroundLight;

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
                        color: isDark
                            ? AppColors.surfaceDark
                            : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark
                              ? AppColors.borderDark
                              : AppColors.borderLight,
                        ),
                      ),
                      child: Icon(Icons.arrow_back,
                          size: 20, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    l10n.settings,
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    _SectionTitle(l10n.settingsAccount, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.person_outline,
                          label: l10n.editProfile,
                          subtitle: l10n.editProfileSubtitle,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const EditProfileScreen()),
                          ),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.lock_outline,
                          label: l10n.changePassword,
                          subtitle: l10n.changePasswordSubtitle,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const ChangePasswordScreen()),
                          ),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.payment_outlined,
                          label: l10n.paymentMethods,
                          subtitle: l10n.paymentMethodsSubtitle,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const PaymentMethodsScreen()),
                          ),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.directions_car_outlined,
                          label: l10n.myVehicles,
                          subtitle: l10n.myVehiclesSubtitle,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const MyVehiclesScreen()),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsAppearance, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.nightlight_outlined,
                          label: l10n.darkMode,
                          subtitle: l10n.darkModeSubtitle,
                          value: themeProvider.isDark,
                          onChanged: (_) => themeProvider.toggleTheme(),
                        ),
                        _Divider(isDark: isDark),
                        _LanguageRow(isDark: isDark),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsNotifications, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.notifications_outlined,
                          label: l10n.pushNotifications,
                          subtitle: l10n.pushNotificationsSubtitle,
                          value: _pushNotifications,
                          onChanged: (v) =>
                              setState(() => _pushNotifications = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.email_outlined,
                          label: l10n.emailNotifications,
                          subtitle: l10n.emailNotificationsSubtitle,
                          value: _emailNotifications,
                          onChanged: (v) =>
                              setState(() => _emailNotifications = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.timer_outlined,
                          label: l10n.sessionReminders,
                          subtitle: l10n.sessionRemindersSubtitle,
                          value: _sessionReminders,
                          onChanged: (v) =>
                              setState(() => _sessionReminders = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.local_parking_outlined,
                          label: l10n.parkingExpiryAlerts,
                          subtitle: l10n.parkingExpirySubtitle,
                          value: _parkingExpiry,
                          onChanged: (v) =>
                              setState(() => _parkingExpiry = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.campaign_outlined,
                          label: l10n.promotionsOffers,
                          subtitle: l10n.promotionsSubtitle,
                          value: _promoAlerts,
                          onChanged: (v) =>
                              setState(() => _promoAlerts = v),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsAutoPay, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.bolt_outlined,
                          label: l10n.autoPayEnabled,
                          subtitle: l10n.autoPayEnabledSubtitle,
                          value: _autoPayEnabled,
                          onChanged: (v) =>
                              setState(() => _autoPayEnabled = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.receipt_outlined,
                          label: l10n.emailReceipt,
                          subtitle: l10n.emailReceiptSubtitle,
                          value: _receiptByEmail,
                          onChanged: (v) =>
                              setState(() => _receiptByEmail = v),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.credit_card_outlined,
                          label: l10n.spendingLimit,
                          subtitle: l10n.spendingLimitSubtitle,
                          onTap: () => _showSpendingLimitSheet(context, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsPrivacySecurity, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.fingerprint,
                          label: l10n.biometricLogin,
                          subtitle: l10n.biometricLoginSubtitle,
                          value: _biometricLogin,
                          onChanged: (v) =>
                              setState(() => _biometricLogin = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.location_on_outlined,
                          label: l10n.backgroundLocation,
                          subtitle: l10n.backgroundLocationSubtitle,
                          value: _locationAlways,
                          onChanged: (v) =>
                              setState(() => _locationAlways = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.analytics_outlined,
                          label: l10n.shareAnalytics,
                          subtitle: l10n.shareAnalyticsSubtitle,
                          value: _shareAnalytics,
                          onChanged: (v) =>
                              setState(() => _shareAnalytics = v),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.history_outlined,
                          label: l10n.clearSearchHistory,
                          subtitle: l10n.clearSearchHistorySubtitle,
                          onTap: () => _confirmClearHistory(context, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsSupportLegal, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.help_outline,
                          label: l10n.helpCenter,
                          subtitle: l10n.helpCenterSubtitle,
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/help'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.chat_bubble_outline,
                          label: l10n.contactSupport,
                          subtitle: l10n.contactSupportSubtitle,
                          onTap: () =>
                              _showContactSheet(context, isDark),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.star_outline,
                          label: l10n.rateEzRakna,
                          subtitle: l10n.rateSubtitle,
                          onTap: () => _launchUrl(
                              'https://play.google.com/store/apps/details?id=com.ezrakna.app'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.privacy_tip_outlined,
                          label: l10n.privacyPolicy,
                          subtitle: l10n.privacyPolicySubtitle,
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/privacy'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.description_outlined,
                          label: l10n.termsOfService,
                          subtitle: l10n.termsSubtitle,
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/terms'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.info_outline,
                          label: l10n.aboutEzRakna,
                          subtitle: 'Version 1.0.0  •  Build 100',
                          onTap: () => _showAboutDialog(context, isDark),
                          showChevron: false,
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _SectionTitle(l10n.settingsDangerZone, textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _DangerRow(
                          isDark: isDark,
                          icon: Icons.logout,
                          label: l10n.logOut,
                          onTap: () => _confirmLogout(context),
                        ),
                        _Divider(isDark: isDark),
                        _DangerRow(
                          isDark: isDark,
                          icon: Icons.delete_forever_outlined,
                          label: l10n.deleteAccount,
                          onTap: () =>
                              _confirmDeleteAccount(context, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Opens a URL in the device's default external browser.
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

  // Bottom sheet with a numeric input for the max Auto-Pay charge per session.
  // viewInsets.bottom pushes the sheet above the keyboard when it opens.
  void _showSpendingLimitSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final controller = TextEditingController();
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: bgColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.borderDark
                      : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(l10n.spendingLimitTitle,
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textColor)),
            const SizedBox(height: 4),
            Text(l10n.spendingLimitDescription,
                style: TextStyle(fontSize: 13, color: subColor)),
            const SizedBox(height: 20),
            TextFormField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: l10n.spendingLimitHint,
                prefixText: 'EGP  ',
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.saveLimit),
            ),
          ],
        ),
      ),
    );
  }

  // Bottom sheet listing email, phone and WhatsApp support channels.
  void _showContactSheet(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      backgroundColor: bgColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.borderDark
                      : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(l10n.contactSupportTitle,
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textColor)),
            const SizedBox(height: 6),
            Text(l10n.contactSupportSubheading,
                style: TextStyle(fontSize: 13, color: subColor)),
            const SizedBox(height: 20),
            _ContactTile(
              isDark: isDark,
              icon: Icons.email_outlined,
              label: l10n.emailSupport,
              subtitle: 'support@ezrakna.com',
              onTap: () => _launchUrl('mailto:support@ezrakna.com'),
            ),
            const SizedBox(height: 12),
            _ContactTile(
              isDark: isDark,
              icon: Icons.phone_outlined,
              label: l10n.callUs,
              subtitle: '+20 100 000 0000',
              onTap: () => _launchUrl('tel:+201000000000'),
            ),
            const SizedBox(height: 12),
            _ContactTile(
              isDark: isDark,
              icon: Icons.chat_outlined,
              label: l10n.whatsapp,
              subtitle: l10n.whatsappSubtitle,
              onTap: () => _launchUrl('https://wa.me/201000000000'),
            ),
          ],
        ),
      ),
    );
  }

  // Dialog showing app name, version, tagline and copyright.
  void _showAboutDialog(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: bgColor,
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.purple.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.local_parking,
                  color: AppColors.purple, size: 40),
            ),
            const SizedBox(height: 16),
            Text('EzRakna',
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: textColor)),
            const SizedBox(height: 4),
            Text('Version 1.0.0  •  Build 100',
                style: TextStyle(fontSize: 13, color: subColor)),
            const SizedBox(height: 12),
            Text(
              l10n.aboutTagline,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: subColor, height: 1.5),
            ),
            const SizedBox(height: 16),
            Text(l10n.copyright,
                style: TextStyle(fontSize: 11, color: subColor)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.close,
                style: const TextStyle(
                    color: AppColors.purple, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  // Confirmation dialog before wiping all saved search history — irreversible.
  void _confirmClearHistory(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: bgColor,
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.clearHistoryConfirmTitle,
            style: TextStyle(
                fontWeight: FontWeight.w700, color: textColor)),
        content: Text(l10n.clearHistoryConfirmMessage,
            style: TextStyle(color: subColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel,
                style: TextStyle(color: subColor)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.clear,
                style: const TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // Confirmation dialog before logout — clears the nav stack and pushes /login.
  void _confirmLogout(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final textColor =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: bgColor,
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.logOutConfirmTitle,
            style: TextStyle(
                fontWeight: FontWeight.w700, color: textColor)),
        content: Text(l10n.logOutConfirmMessage,
            style: TextStyle(color: subColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel, style: TextStyle(color: subColor)),
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
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // Confirmation dialog for permanent account deletion — all data is lost.
  void _confirmDeleteAccount(BuildContext context, bool isDark) {
    final l10n = AppLocalizations.of(context)!;
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: bgColor,
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.deleteAccountTitle,
            style: const TextStyle(
                color: Colors.redAccent, fontWeight: FontWeight.w700)),
        content: Text(
          l10n.deleteAccountFullMessage,
          style: TextStyle(color: subColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l10n.cancel, style: TextStyle(color: subColor)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);

            },
            child: Text(l10n.delete,
                style: const TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// All-caps section label with letter spacing used above each settings group.
class _SectionTitle extends StatelessWidget {
  final String text;
  final Color color;
  const _SectionTitle(this.text, this.color);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.2,
        color: color,
      ),
    );
  }
}

// Rounded card container that groups related settings rows with a border.
class _SettingsCard extends StatelessWidget {
  final bool isDark;
  final List<Widget> children;
  const _SettingsCard({required this.isDark, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight),
      ),
      child: Column(children: children),
    );
  }
}

// Thin row divider indented to align with the row content, not the icon.
class _Divider extends StatelessWidget {
  final bool isDark;
  const _Divider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      indent: 52,
      color: isDark ? AppColors.borderDark : AppColors.borderLight,
    );
  }
}

// Tappable settings row with icon, label, subtitle and optional chevron.
class _NavRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  final bool showChevron;

  const _NavRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
    this.showChevron = true,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Icon(icon, color: textPrimary, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style:
                      TextStyle(fontSize: 12, color: textSecondary)),
                ],
              ),
            ),
            if (showChevron)
              Icon(Icons.chevron_right,
                  size: 18, color: textSecondary),
          ],
        ),
      ),
    );
  }
}

// Settings row with icon, label, subtitle and a purple Switch toggle.
class _SwitchRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchRow({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Icon(icon, color: textPrimary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(fontSize: 12, color: textSecondary)),
              ],
            ),
          ),
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

// Language preference row with an EN/AR animated pill toggle.
// Watches LocaleProvider directly so it rebuilds independently of the parent.
class _LanguageRow extends StatelessWidget {
  final bool isDark;
  const _LanguageRow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    // Watch directly so language row rebuilds on locale change without rebuilding the full screen.
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
                    style:
                    TextStyle(fontSize: 12, color: textSecondary)),
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
                  child: _LangOption(
                      label: 'EN', isActive: !isArabic, isDark: isDark),
                ),
                GestureDetector(
                  onTap: isArabic ? null : localeProvider.toggleLocale,
                  child: _LangOption(
                      label: 'AR', isActive: isArabic, isDark: isDark),
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
      {required this.label,
        required this.isActive,
        required this.isDark});

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

// Red-coloured action row used in the Danger Zone section (logout, delete).
class _DangerRow extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DangerRow({
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
        padding:
        const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: Colors.redAccent, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Colors.redAccent)),
            ),
          ],
        ),
      ),
    );
  }
}

// Tappable contact option tile used inside the contact support bottom sheet.
class _ContactTile extends StatelessWidget {
  final bool isDark;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _ContactTile({
    required this.isDark,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary =
    isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final bgColor =
    isDark ? AppColors.backgroundDark : AppColors.backgroundLight;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding:
        const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color:
              isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.purple, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style:
                      TextStyle(fontSize: 12, color: textSecondary)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, size: 16, color: textSecondary),
          ],
        ),
      ),
    );
  }
}