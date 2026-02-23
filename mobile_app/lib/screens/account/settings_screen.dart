import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_colors.dart';
import '../../providers/theme_provider.dart';
import '../../providers/locale_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // ── Notification toggles ──
  bool _pushNotifications = true;
  bool _emailNotifications = false;
  bool _sessionReminders = true;
  bool _promoAlerts = false;
  bool _parkingExpiry = true;

  // ── Privacy toggles ──
  bool _locationAlways = false;
  bool _shareAnalytics = true;
  bool _biometricLogin = false;

  // ── Auto-Pay toggles ──
  bool _autoPayEnabled = true;
  bool _receiptByEmail = true;

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final localeProvider = context.watch<LocaleProvider>();
    final isDark = themeProvider.isDark;
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
            // ── Top bar ───────────────────────────────────────────────
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
                    'Settings',
                    style: TextStyle(
                      color: textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),

            // ── Scrollable content ─────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── ACCOUNT ──────────────────────────────────────
                    _SectionTitle('ACCOUNT', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.person_outline,
                          label: 'Edit Profile',
                          subtitle: 'Name, email, phone number',
                          onTap: () {
                            // TODO: navigate to edit profile
                          },
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.lock_outline,
                          label: 'Change Password',
                          subtitle: 'Update your password',
                          onTap: () {
                            // TODO: navigate to change password
                          },
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.payment_outlined,
                          label: 'Payment Methods',
                          subtitle: 'Cards and Auto-Pay settings',
                          onTap: () {
                            Navigator.of(context).pop();
                            // The wallet screen handles payment methods
                          },
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.directions_car_outlined,
                          label: 'My Vehicles',
                          subtitle: 'Manage registered vehicles',
                          onTap: () {
                            Navigator.of(context).pop();
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── APPEARANCE ────────────────────────────────────
                    _SectionTitle('APPEARANCE', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.nightlight_outlined,
                          label: 'Dark Mode',
                          subtitle: 'Switch app theme',
                          value: themeProvider.isDark,
                          onChanged: (_) => themeProvider.toggleTheme(),
                        ),
                        _Divider(isDark: isDark),
                        _LanguageRow(isDark: isDark),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── NOTIFICATIONS ─────────────────────────────────
                    _SectionTitle('NOTIFICATIONS', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.notifications_outlined,
                          label: 'Push Notifications',
                          subtitle: 'Receive alerts on your device',
                          value: _pushNotifications,
                          onChanged: (v) =>
                              setState(() => _pushNotifications = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.email_outlined,
                          label: 'Email Notifications',
                          subtitle: 'Receipts and account updates',
                          value: _emailNotifications,
                          onChanged: (v) =>
                              setState(() => _emailNotifications = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.timer_outlined,
                          label: 'Session Reminders',
                          subtitle: 'Get notified before your session ends',
                          value: _sessionReminders,
                          onChanged: (v) =>
                              setState(() => _sessionReminders = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.local_parking_outlined,
                          label: 'Parking Expiry Alerts',
                          subtitle: 'Alert when time is about to run out',
                          value: _parkingExpiry,
                          onChanged: (v) =>
                              setState(() => _parkingExpiry = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.campaign_outlined,
                          label: 'Promotions & Offers',
                          subtitle: 'Deals, discounts and news',
                          value: _promoAlerts,
                          onChanged: (v) =>
                              setState(() => _promoAlerts = v),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── AUTO-PAY ──────────────────────────────────────
                    _SectionTitle('AUTO-PAY', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.bolt_outlined,
                          label: 'Auto-Pay Enabled',
                          subtitle: 'Automatically pay when exiting',
                          value: _autoPayEnabled,
                          onChanged: (v) =>
                              setState(() => _autoPayEnabled = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.receipt_outlined,
                          label: 'Email Receipt',
                          subtitle: 'Send receipt to your email after payment',
                          value: _receiptByEmail,
                          onChanged: (v) =>
                              setState(() => _receiptByEmail = v),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.credit_card_outlined,
                          label: 'Spending Limit',
                          subtitle: 'Set a maximum Auto-Pay amount',
                          onTap: () => _showSpendingLimitSheet(context, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── PRIVACY & SECURITY ────────────────────────────
                    _SectionTitle('PRIVACY & SECURITY', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.fingerprint,
                          label: 'Biometric Login',
                          subtitle: 'Use fingerprint or Face ID to sign in',
                          value: _biometricLogin,
                          onChanged: (v) =>
                              setState(() => _biometricLogin = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.location_on_outlined,
                          label: 'Background Location',
                          subtitle: 'Allow location access when app is closed',
                          value: _locationAlways,
                          onChanged: (v) =>
                              setState(() => _locationAlways = v),
                        ),
                        _Divider(isDark: isDark),
                        _SwitchRow(
                          isDark: isDark,
                          icon: Icons.analytics_outlined,
                          label: 'Share Analytics',
                          subtitle: 'Help improve the app with usage data',
                          value: _shareAnalytics,
                          onChanged: (v) =>
                              setState(() => _shareAnalytics = v),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.history_outlined,
                          label: 'Clear Search History',
                          subtitle: 'Remove all saved searches',
                          onTap: () => _confirmClearHistory(context, isDark),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── SUPPORT & LEGAL ───────────────────────────────
                    _SectionTitle('SUPPORT & LEGAL', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.help_outline,
                          label: 'Help Center',
                          subtitle: 'FAQs and support articles',
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/help'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.chat_bubble_outline,
                          label: 'Contact Support',
                          subtitle: 'Chat, email or call us',
                          onTap: () =>
                              _showContactSheet(context, isDark),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.star_outline,
                          label: 'Rate EzRakna',
                          subtitle: 'Share your feedback on the store',
                          onTap: () => _launchUrl(
                              'https://play.google.com/store/apps/details?id=com.ezrakna.app'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.privacy_tip_outlined,
                          label: 'Privacy Policy',
                          subtitle: 'How we handle your data',
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/privacy'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.description_outlined,
                          label: 'Terms of Service',
                          subtitle: 'Our terms and conditions',
                          onTap: () =>
                              _launchUrl('https://ezrakna.com/terms'),
                        ),
                        _Divider(isDark: isDark),
                        _NavRow(
                          isDark: isDark,
                          icon: Icons.info_outline,
                          label: 'About EzRakna',
                          subtitle: 'Version 1.0.0  •  Build 100',
                          onTap: () => _showAboutDialog(context, isDark),
                          showChevron: false,
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── DANGER ZONE ───────────────────────────────────
                    _SectionTitle('DANGER ZONE', textSecondary),
                    const SizedBox(height: 10),
                    _SettingsCard(
                      isDark: isDark,
                      children: [
                        _DangerRow(
                          isDark: isDark,
                          icon: Icons.logout,
                          label: 'Log Out',
                          onTap: () => _confirmLogout(context),
                        ),
                        _Divider(isDark: isDark),
                        _DangerRow(
                          isDark: isDark,
                          icon: Icons.delete_forever_outlined,
                          label: 'Delete Account',
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

  // ── Actions ─────────────────────────────────────────────────────────────────

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

  void _showSpendingLimitSheet(BuildContext context, bool isDark) {
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
            Text('Spending Limit',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textColor)),
            const SizedBox(height: 4),
            Text('Set the maximum amount Auto-Pay can charge per session.',
                style: TextStyle(fontSize: 13, color: subColor)),
            const SizedBox(height: 20),
            TextFormField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                hintText: 'e.g. 200',
                prefixText: 'EGP  ',
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Save Limit'),
            ),
          ],
        ),
      ),
    );
  }

  void _showContactSheet(BuildContext context, bool isDark) {
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
            Text('Contact Support',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textColor)),
            const SizedBox(height: 6),
            Text('Reach us through any of these channels:',
                style: TextStyle(fontSize: 13, color: subColor)),
            const SizedBox(height: 20),
            _ContactTile(
              isDark: isDark,
              icon: Icons.email_outlined,
              label: 'Email Support',
              subtitle: 'support@ezrakna.com',
              onTap: () => _launchUrl('mailto:support@ezrakna.com'),
            ),
            const SizedBox(height: 12),
            _ContactTile(
              isDark: isDark,
              icon: Icons.phone_outlined,
              label: 'Call Us',
              subtitle: '+20 100 000 0000',
              onTap: () => _launchUrl('tel:+201000000000'),
            ),
            const SizedBox(height: 12),
            _ContactTile(
              isDark: isDark,
              icon: Icons.chat_outlined,
              label: 'WhatsApp',
              subtitle: 'Chat with support',
              onTap: () => _launchUrl('https://wa.me/201000000000'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context, bool isDark) {
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
              'Smart parking, made simple.\nFind, navigate, and pay for parking effortlessly.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: subColor, height: 1.5),
            ),
            const SizedBox(height: 16),
            Text('© 2025 EzRakna. All rights reserved.',
                style: TextStyle(fontSize: 11, color: subColor)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close',
                style: TextStyle(
                    color: AppColors.purple, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _confirmClearHistory(BuildContext context, bool isDark) {
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
        title: Text('Clear Search History',
            style: TextStyle(
                fontWeight: FontWeight.w700, color: textColor)),
        content: Text('This will remove all your saved searches. This cannot be undone.',
            style: TextStyle(color: subColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: TextStyle(color: subColor)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Clear',
                style: TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    final isDark = context.read<ThemeProvider>().isDark;
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
        title: Text('Log Out',
            style: TextStyle(
                fontWeight: FontWeight.w700, color: textColor)),
        content: Text('Are you sure you want to log out?',
            style: TextStyle(color: subColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: subColor)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Pop back to root and navigate to login
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/login',
                    (route) => false,
              );
            },
            child: const Text('Log Out',
                style: TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context, bool isDark) {
    final bgColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final subColor =
    isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: bgColor,
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Account',
            style: TextStyle(
                color: Colors.redAccent, fontWeight: FontWeight.w700)),
        content: Text(
          'This is permanent and cannot be undone. All your data, vehicles, and payment methods will be removed.',
          style: TextStyle(color: subColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: subColor)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // TODO: call delete account API
            },
            child: const Text('Delete',
                style: TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Section title ─────────────────────────────────────────────────────────────
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

// ── Settings card container ───────────────────────────────────────────────────
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

// ── Divider ───────────────────────────────────────────────────────────────────
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

// ── Nav row (with subtitle) ───────────────────────────────────────────────────
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

// ── Switch row (with subtitle) ────────────────────────────────────────────────
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

// ── Language row ──────────────────────────────────────────────────────────────
class _LanguageRow extends StatelessWidget {
  final bool isDark;
  const _LanguageRow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    // Watch directly so this widget rebuilds on every locale change
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
                Text('Language',
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: textPrimary)),
                const SizedBox(height: 2),
                Text(isArabic ? 'العربية' : 'English',
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

// ── Danger row ────────────────────────────────────────────────────────────────
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

// ── Contact tile ──────────────────────────────────────────────────────────────
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