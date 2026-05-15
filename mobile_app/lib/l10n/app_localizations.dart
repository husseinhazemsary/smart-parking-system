import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// No description provided for @splashTagline.
  ///
  /// In en, this message translates to:
  /// **'Your Spot, Ready Before You Arrive'**
  String get splashTagline;

  /// No description provided for @onboarding1Title.
  ///
  /// In en, this message translates to:
  /// **'See Available Spots in'**
  String get onboarding1Title;

  /// No description provided for @onboarding1Highlight.
  ///
  /// In en, this message translates to:
  /// **'Real-Time'**
  String get onboarding1Highlight;

  /// No description provided for @onboarding1Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Never waste time searching for parking'**
  String get onboarding1Subtitle;

  /// No description provided for @onboarding2Title.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get onboarding2Title;

  /// No description provided for @onboarding2Highlight.
  ///
  /// In en, this message translates to:
  /// **'Directly'**
  String get onboarding2Highlight;

  /// No description provided for @onboarding2TitleEnd.
  ///
  /// In en, this message translates to:
  /// **' to your spot'**
  String get onboarding2TitleEnd;

  /// No description provided for @onboarding2Subtitle.
  ///
  /// In en, this message translates to:
  /// **'Save time and fuel. It guides you to the best open spot instantly.'**
  String get onboarding2Subtitle;

  /// No description provided for @onboarding3TitleHighlight.
  ///
  /// In en, this message translates to:
  /// **'Smart Insights'**
  String get onboarding3TitleHighlight;

  /// No description provided for @onboarding3Title.
  ///
  /// In en, this message translates to:
  /// **' for\nBetter Parking'**
  String get onboarding3Title;

  /// No description provided for @onboarding3Subtitle.
  ///
  /// In en, this message translates to:
  /// **'See peak hours, availability predictions, and find the best time to park.'**
  String get onboarding3Subtitle;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @yes.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get no;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'(Optional)'**
  String get optional;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// No description provided for @fullNameHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get fullNameHint;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get emailHint;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumber;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number'**
  String get phoneHint;

  /// No description provided for @dateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Date of Birth'**
  String get dateOfBirth;

  /// No description provided for @dobHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your Date of Birth'**
  String get dobHint;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'Create a password'**
  String get passwordHint;

  /// No description provided for @notificationsConsent.
  ///
  /// In en, this message translates to:
  /// **'I agree to receive safety notifications and updates about my driving habits'**
  String get notificationsConsent;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signIn;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBack;

  /// No description provided for @passwordHintLogin.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get passwordHintLogin;

  /// No description provided for @rememberMe.
  ///
  /// In en, this message translates to:
  /// **'Remember me'**
  String get rememberMe;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// No description provided for @orContinueWith.
  ///
  /// In en, this message translates to:
  /// **'or continue with'**
  String get orContinueWith;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @continueWithApple.
  ///
  /// In en, this message translates to:
  /// **'Continue with Apple'**
  String get continueWithApple;

  /// No description provided for @noAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get noAccount;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get navWallet;

  /// No description provided for @navHistory.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get navHistory;

  /// No description provided for @navAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get navAccount;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @myVehicles.
  ///
  /// In en, this message translates to:
  /// **'MY VEHICLES'**
  String get myVehicles;

  /// No description provided for @addVehicle.
  ///
  /// In en, this message translates to:
  /// **'Add Vehicle'**
  String get addVehicle;

  /// No description provided for @preferences.
  ///
  /// In en, this message translates to:
  /// **'PREFERENCES'**
  String get preferences;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// No description provided for @support.
  ///
  /// In en, this message translates to:
  /// **'SUPPORT'**
  String get support;

  /// No description provided for @helpCenter.
  ///
  /// In en, this message translates to:
  /// **'Help Center'**
  String get helpCenter;

  /// No description provided for @contactUs.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get contactUs;

  /// No description provided for @rateTheApp.
  ///
  /// In en, this message translates to:
  /// **'Rate the App'**
  String get rateTheApp;

  /// No description provided for @legal.
  ///
  /// In en, this message translates to:
  /// **'LEGAL'**
  String get legal;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @logOutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOutConfirmTitle;

  /// No description provided for @logOutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to log out?'**
  String get logOutConfirmMessage;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccount;

  /// No description provided for @deleteAccountMessage.
  ///
  /// In en, this message translates to:
  /// **'This action is permanent and cannot be undone. All your data will be lost.'**
  String get deleteAccountMessage;

  /// No description provided for @bookings.
  ///
  /// In en, this message translates to:
  /// **'Bookings'**
  String get bookings;

  /// No description provided for @spent.
  ///
  /// In en, this message translates to:
  /// **'Spent'**
  String get spent;

  /// No description provided for @parked.
  ///
  /// In en, this message translates to:
  /// **'Parked'**
  String get parked;

  /// No description provided for @emailSupport.
  ///
  /// In en, this message translates to:
  /// **'Email Support'**
  String get emailSupport;

  /// No description provided for @callUs.
  ///
  /// In en, this message translates to:
  /// **'Call Us'**
  String get callUs;

  /// No description provided for @whatsapp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get whatsapp;

  /// No description provided for @chatOnWhatsApp.
  ///
  /// In en, this message translates to:
  /// **'Chat on WhatsApp'**
  String get chatOnWhatsApp;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get changePassword;

  /// No description provided for @paymentMethods.
  ///
  /// In en, this message translates to:
  /// **'Payment Methods'**
  String get paymentMethods;

  /// No description provided for @addVehicleTitle.
  ///
  /// In en, this message translates to:
  /// **'Add Vehicle'**
  String get addVehicleTitle;

  /// No description provided for @addVehicleSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Used for entry/exit recognition and Auto-Pay.'**
  String get addVehicleSubtitle;

  /// No description provided for @licensePlate.
  ///
  /// In en, this message translates to:
  /// **'License Plate Number'**
  String get licensePlate;

  /// No description provided for @licensePlateHint.
  ///
  /// In en, this message translates to:
  /// **'ABC   1234'**
  String get licensePlateHint;

  /// No description provided for @vehicleNickname.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Nickname'**
  String get vehicleNickname;

  /// No description provided for @vehicleNicknameHint.
  ///
  /// In en, this message translates to:
  /// **'Daily Driver'**
  String get vehicleNicknameHint;

  /// No description provided for @vehicleType.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Type'**
  String get vehicleType;

  /// No description provided for @makeAndModel.
  ///
  /// In en, this message translates to:
  /// **'Make & Model'**
  String get makeAndModel;

  /// No description provided for @makeAndModelHint.
  ///
  /// In en, this message translates to:
  /// **'Search make...'**
  String get makeAndModelHint;

  /// No description provided for @setAsDefault.
  ///
  /// In en, this message translates to:
  /// **'Set as default vehicle'**
  String get setAsDefault;

  /// No description provided for @autoPaySettings.
  ///
  /// In en, this message translates to:
  /// **'Auto-Pay Settings'**
  String get autoPaySettings;

  /// No description provided for @saveVehicle.
  ///
  /// In en, this message translates to:
  /// **'Save Vehicle'**
  String get saveVehicle;

  /// No description provided for @vehicleTypeSedan.
  ///
  /// In en, this message translates to:
  /// **'Sedan'**
  String get vehicleTypeSedan;

  /// No description provided for @vehicleTypeSUV.
  ///
  /// In en, this message translates to:
  /// **'SUV'**
  String get vehicleTypeSUV;

  /// No description provided for @vehicleTypeTruck.
  ///
  /// In en, this message translates to:
  /// **'Truck'**
  String get vehicleTypeTruck;

  /// No description provided for @defaultLabel.
  ///
  /// In en, this message translates to:
  /// **'Default'**
  String get defaultLabel;

  /// No description provided for @change.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get change;

  /// No description provided for @wallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get wallet;

  /// No description provided for @paymentMethodsSection.
  ///
  /// In en, this message translates to:
  /// **'Payment Methods'**
  String get paymentMethodsSection;

  /// No description provided for @addNewCard.
  ///
  /// In en, this message translates to:
  /// **'+ Add new card'**
  String get addNewCard;

  /// No description provided for @addCard.
  ///
  /// In en, this message translates to:
  /// **'Add card'**
  String get addCard;

  /// No description provided for @activeSession.
  ///
  /// In en, this message translates to:
  /// **'Active Session'**
  String get activeSession;

  /// No description provided for @recentActivity.
  ///
  /// In en, this message translates to:
  /// **'Recent Activity'**
  String get recentActivity;

  /// No description provided for @viewAllTransactions.
  ///
  /// In en, this message translates to:
  /// **'View all transactions'**
  String get viewAllTransactions;

  /// No description provided for @viewDetails.
  ///
  /// In en, this message translates to:
  /// **'View Details'**
  String get viewDetails;

  /// No description provided for @live.
  ///
  /// In en, this message translates to:
  /// **'LIVE'**
  String get live;

  /// No description provided for @estCost.
  ///
  /// In en, this message translates to:
  /// **'EST. COST'**
  String get estCost;

  /// No description provided for @cardNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'Card Number'**
  String get cardNumberLabel;

  /// No description provided for @expiry.
  ///
  /// In en, this message translates to:
  /// **'Expiry'**
  String get expiry;

  /// No description provided for @primary.
  ///
  /// In en, this message translates to:
  /// **'Primary'**
  String get primary;

  /// No description provided for @paid.
  ///
  /// In en, this message translates to:
  /// **'PAID'**
  String get paid;

  /// No description provided for @failed.
  ///
  /// In en, this message translates to:
  /// **'FAILED'**
  String get failed;

  /// No description provided for @addNewCardTitle.
  ///
  /// In en, this message translates to:
  /// **'Add new card'**
  String get addNewCardTitle;

  /// No description provided for @cardNumber.
  ///
  /// In en, this message translates to:
  /// **'Card Number'**
  String get cardNumber;

  /// No description provided for @cardNumberHint.
  ///
  /// In en, this message translates to:
  /// **'0000 0000 0000 0000'**
  String get cardNumberHint;

  /// No description provided for @expiryDate.
  ///
  /// In en, this message translates to:
  /// **'Expiry Date'**
  String get expiryDate;

  /// No description provided for @expiryHint.
  ///
  /// In en, this message translates to:
  /// **'MM / YY'**
  String get expiryHint;

  /// No description provided for @cvcCvv.
  ///
  /// In en, this message translates to:
  /// **'CVC / CVV'**
  String get cvcCvv;

  /// No description provided for @cvvHint.
  ///
  /// In en, this message translates to:
  /// **'123'**
  String get cvvHint;

  /// No description provided for @nameOnCard.
  ///
  /// In en, this message translates to:
  /// **'Name on card'**
  String get nameOnCard;

  /// No description provided for @nameOnCardHint.
  ///
  /// In en, this message translates to:
  /// **'John Doe'**
  String get nameOnCardHint;

  /// No description provided for @autoPaySettingsSection.
  ///
  /// In en, this message translates to:
  /// **'AUTO-PAY SETTINGS'**
  String get autoPaySettingsSection;

  /// No description provided for @setAsDefaultCard.
  ///
  /// In en, this message translates to:
  /// **'Set as default Auto-Pay card'**
  String get setAsDefaultCard;

  /// No description provided for @useAsBackup.
  ///
  /// In en, this message translates to:
  /// **'Use as backup payment method'**
  String get useAsBackup;

  /// No description provided for @encryptedNote.
  ///
  /// In en, this message translates to:
  /// **'Your info is encrypted and stored securely'**
  String get encryptedNote;

  /// No description provided for @saveCard.
  ///
  /// In en, this message translates to:
  /// **'Save Card'**
  String get saveCard;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @settingsAccount.
  ///
  /// In en, this message translates to:
  /// **'ACCOUNT'**
  String get settingsAccount;

  /// No description provided for @settingsAppearance.
  ///
  /// In en, this message translates to:
  /// **'APPEARANCE'**
  String get settingsAppearance;

  /// No description provided for @settingsNotifications.
  ///
  /// In en, this message translates to:
  /// **'NOTIFICATIONS'**
  String get settingsNotifications;

  /// No description provided for @settingsAutoPay.
  ///
  /// In en, this message translates to:
  /// **'AUTO-PAY'**
  String get settingsAutoPay;

  /// No description provided for @settingsPrivacySecurity.
  ///
  /// In en, this message translates to:
  /// **'PRIVACY & SECURITY'**
  String get settingsPrivacySecurity;

  /// No description provided for @settingsSupportLegal.
  ///
  /// In en, this message translates to:
  /// **'SUPPORT & LEGAL'**
  String get settingsSupportLegal;

  /// No description provided for @settingsDangerZone.
  ///
  /// In en, this message translates to:
  /// **'DANGER ZONE'**
  String get settingsDangerZone;

  /// No description provided for @editProfileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Name, email, phone number'**
  String get editProfileSubtitle;

  /// No description provided for @changePasswordSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Update your password'**
  String get changePasswordSubtitle;

  /// No description provided for @paymentMethodsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Cards and Auto-Pay settings'**
  String get paymentMethodsSubtitle;

  /// No description provided for @myVehiclesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage registered vehicles'**
  String get myVehiclesSubtitle;

  /// No description provided for @darkModeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Switch app theme'**
  String get darkModeSubtitle;

  /// No description provided for @languageCurrent.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageCurrent;

  /// No description provided for @languageCurrentAr.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get languageCurrentAr;

  /// No description provided for @pushNotifications.
  ///
  /// In en, this message translates to:
  /// **'Push Notifications'**
  String get pushNotifications;

  /// No description provided for @pushNotificationsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Receive alerts on your device'**
  String get pushNotificationsSubtitle;

  /// No description provided for @emailNotifications.
  ///
  /// In en, this message translates to:
  /// **'Email Notifications'**
  String get emailNotifications;

  /// No description provided for @emailNotificationsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Receipts and account updates'**
  String get emailNotificationsSubtitle;

  /// No description provided for @sessionReminders.
  ///
  /// In en, this message translates to:
  /// **'Session Reminders'**
  String get sessionReminders;

  /// No description provided for @sessionRemindersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Get notified before your session ends'**
  String get sessionRemindersSubtitle;

  /// No description provided for @parkingExpiryAlerts.
  ///
  /// In en, this message translates to:
  /// **'Parking Expiry Alerts'**
  String get parkingExpiryAlerts;

  /// No description provided for @parkingExpirySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Alert when time is about to run out'**
  String get parkingExpirySubtitle;

  /// No description provided for @promotionsOffers.
  ///
  /// In en, this message translates to:
  /// **'Promotions & Offers'**
  String get promotionsOffers;

  /// No description provided for @promotionsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Deals, discounts and news'**
  String get promotionsSubtitle;

  /// No description provided for @autoPayEnabled.
  ///
  /// In en, this message translates to:
  /// **'Auto-Pay Enabled'**
  String get autoPayEnabled;

  /// No description provided for @autoPayEnabledSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Automatically pay when exiting'**
  String get autoPayEnabledSubtitle;

  /// No description provided for @emailReceipt.
  ///
  /// In en, this message translates to:
  /// **'Email Receipt'**
  String get emailReceipt;

  /// No description provided for @emailReceiptSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Send receipt to your email after payment'**
  String get emailReceiptSubtitle;

  /// No description provided for @spendingLimit.
  ///
  /// In en, this message translates to:
  /// **'Spending Limit'**
  String get spendingLimit;

  /// No description provided for @spendingLimitSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Set a maximum Auto-Pay amount'**
  String get spendingLimitSubtitle;

  /// No description provided for @spendingLimitTitle.
  ///
  /// In en, this message translates to:
  /// **'Spending Limit'**
  String get spendingLimitTitle;

  /// No description provided for @spendingLimitDescription.
  ///
  /// In en, this message translates to:
  /// **'Set the maximum amount Auto-Pay can charge per session.'**
  String get spendingLimitDescription;

  /// No description provided for @spendingLimitHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. 200'**
  String get spendingLimitHint;

  /// No description provided for @saveLimit.
  ///
  /// In en, this message translates to:
  /// **'Save Limit'**
  String get saveLimit;

  /// No description provided for @biometricLogin.
  ///
  /// In en, this message translates to:
  /// **'Biometric Login'**
  String get biometricLogin;

  /// No description provided for @biometricLoginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Use fingerprint or Face ID to sign in'**
  String get biometricLoginSubtitle;

  /// No description provided for @backgroundLocation.
  ///
  /// In en, this message translates to:
  /// **'Background Location'**
  String get backgroundLocation;

  /// No description provided for @backgroundLocationSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Allow location access when app is closed'**
  String get backgroundLocationSubtitle;

  /// No description provided for @shareAnalytics.
  ///
  /// In en, this message translates to:
  /// **'Share Analytics'**
  String get shareAnalytics;

  /// No description provided for @shareAnalyticsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Help improve the app with usage data'**
  String get shareAnalyticsSubtitle;

  /// No description provided for @clearSearchHistory.
  ///
  /// In en, this message translates to:
  /// **'Clear Search History'**
  String get clearSearchHistory;

  /// No description provided for @clearSearchHistorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Remove all saved searches'**
  String get clearSearchHistorySubtitle;

  /// No description provided for @clearHistoryConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Clear Search History'**
  String get clearHistoryConfirmTitle;

  /// No description provided for @clearHistoryConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'This will remove all your saved searches. This cannot be undone.'**
  String get clearHistoryConfirmMessage;

  /// No description provided for @clear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clear;

  /// No description provided for @helpCenterSubtitle.
  ///
  /// In en, this message translates to:
  /// **'FAQs and support articles'**
  String get helpCenterSubtitle;

  /// No description provided for @contactSupport.
  ///
  /// In en, this message translates to:
  /// **'Contact Support'**
  String get contactSupport;

  /// No description provided for @contactSupportSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Chat, email or call us'**
  String get contactSupportSubtitle;

  /// No description provided for @rateEzRakna.
  ///
  /// In en, this message translates to:
  /// **'Rate EzRakna'**
  String get rateEzRakna;

  /// No description provided for @rateSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Share your feedback on the store'**
  String get rateSubtitle;

  /// No description provided for @privacyPolicySubtitle.
  ///
  /// In en, this message translates to:
  /// **'How we handle your data'**
  String get privacyPolicySubtitle;

  /// No description provided for @termsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Our terms and conditions'**
  String get termsSubtitle;

  /// No description provided for @aboutEzRakna.
  ///
  /// In en, this message translates to:
  /// **'About EzRakna'**
  String get aboutEzRakna;

  /// No description provided for @aboutTagline.
  ///
  /// In en, this message translates to:
  /// **'Smart parking, made simple.\nFind, navigate, and pay for parking effortlessly.'**
  String get aboutTagline;

  /// No description provided for @copyright.
  ///
  /// In en, this message translates to:
  /// **'© 2025 EzRakna. All rights reserved.'**
  String get copyright;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountFullMessage.
  ///
  /// In en, this message translates to:
  /// **'This is permanent and cannot be undone. All your data, vehicles, and payment methods will be removed.'**
  String get deleteAccountFullMessage;

  /// No description provided for @contactSupportTitle.
  ///
  /// In en, this message translates to:
  /// **'Contact Support'**
  String get contactSupportTitle;

  /// No description provided for @contactSupportSubheading.
  ///
  /// In en, this message translates to:
  /// **'Reach us through any of these channels:'**
  String get contactSupportSubheading;

  /// No description provided for @callUsNumber.
  ///
  /// In en, this message translates to:
  /// **'+20 100 000 0000'**
  String get callUsNumber;

  /// No description provided for @whatsappSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Chat with support'**
  String get whatsappSubtitle;

  /// No description provided for @accessibleParking.
  ///
  /// In en, this message translates to:
  /// **'Accessible Parking'**
  String get accessibleParking;

  /// No description provided for @accessibleParkingHint.
  ///
  /// In en, this message translates to:
  /// **'Require accessible parking spots'**
  String get accessibleParkingHint;

  /// No description provided for @accessibleParkingDialogTitle.
  ///
  /// In en, this message translates to:
  /// **'Enable Accessible Parking?'**
  String get accessibleParkingDialogTitle;

  /// No description provided for @accessibleParkingDialogBody.
  ///
  /// In en, this message translates to:
  /// **'By enabling this, you confirm that you hold a valid disability or accessibility permit. Misuse of this feature may result in account suspension.\n\nThis preference will be recorded on your account.'**
  String get accessibleParkingDialogBody;

  /// No description provided for @accessibleParkingConfirm.
  ///
  /// In en, this message translates to:
  /// **'I Confirm'**
  String get accessibleParkingConfirm;

  /// No description provided for @contactUsSubheading.
  ///
  /// In en, this message translates to:
  /// **'Reach us through any of these channels:'**
  String get contactUsSubheading;

  /// No description provided for @helpCenterSubheading.
  ///
  /// In en, this message translates to:
  /// **'Browse help articles and FAQs'**
  String get helpCenterSubheading;

  /// No description provided for @visitHelpCenter.
  ///
  /// In en, this message translates to:
  /// **'Visit Help Center'**
  String get visitHelpCenter;

  /// No description provided for @liveChat.
  ///
  /// In en, this message translates to:
  /// **'Live Chat'**
  String get liveChat;

  /// No description provided for @liveChatSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Chat with a support agent'**
  String get liveChatSubtitle;

  /// No description provided for @enjoyingEzRakna.
  ///
  /// In en, this message translates to:
  /// **'Enjoying EzRakna?'**
  String get enjoyingEzRakna;

  /// No description provided for @feedbackHelpsUs.
  ///
  /// In en, this message translates to:
  /// **'Your feedback helps us improve.'**
  String get feedbackHelpsUs;

  /// No description provided for @rateOnGooglePlay.
  ///
  /// In en, this message translates to:
  /// **'Rate on Google Play'**
  String get rateOnGooglePlay;

  /// No description provided for @rateOnPlayStoreSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Leave a review on the Play Store'**
  String get rateOnPlayStoreSubtitle;

  /// No description provided for @sendFeedback.
  ///
  /// In en, this message translates to:
  /// **'Send Feedback'**
  String get sendFeedback;

  /// No description provided for @sendFeedbackSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Share your thoughts with us'**
  String get sendFeedbackSubtitle;

  /// No description provided for @privacyPolicySheetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Last updated: January 2025'**
  String get privacyPolicySheetSubtitle;

  /// No description provided for @readFullPrivacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Read Full Privacy Policy'**
  String get readFullPrivacyPolicy;

  /// No description provided for @privacyInquiries.
  ///
  /// In en, this message translates to:
  /// **'Privacy Inquiries'**
  String get privacyInquiries;

  /// No description provided for @termsSheetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Last updated: January 2025'**
  String get termsSheetSubtitle;

  /// No description provided for @readFullTerms.
  ///
  /// In en, this message translates to:
  /// **'Read Full Terms'**
  String get readFullTerms;

  /// No description provided for @legalInquiries.
  ///
  /// In en, this message translates to:
  /// **'Legal Inquiries'**
  String get legalInquiries;

  /// No description provided for @deleteVehicle.
  ///
  /// In en, this message translates to:
  /// **'Delete Vehicle'**
  String get deleteVehicle;

  /// No description provided for @removeVehicleConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to remove {name}?'**
  String removeVehicleConfirm(String name);

  /// No description provided for @failedToDeleteVehicle.
  ///
  /// In en, this message translates to:
  /// **'Failed to delete vehicle'**
  String get failedToDeleteVehicle;

  /// No description provided for @myVehiclesTitle.
  ///
  /// In en, this message translates to:
  /// **'My Vehicles'**
  String get myVehiclesTitle;

  /// No description provided for @vehicleDefaultHint.
  ///
  /// In en, this message translates to:
  /// **'This vehicle will be used for Auto-Pay and entry recognition by default.'**
  String get vehicleDefaultHint;

  /// No description provided for @takeAPhoto.
  ///
  /// In en, this message translates to:
  /// **'Take a Photo'**
  String get takeAPhoto;

  /// No description provided for @chooseFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from Gallery'**
  String get chooseFromGallery;

  /// No description provided for @couldNotReadPlate.
  ///
  /// In en, this message translates to:
  /// **'Could not read plate. Please enter manually.'**
  String get couldNotReadPlate;

  /// No description provided for @plateRequired.
  ///
  /// In en, this message translates to:
  /// **'License plate number is required.'**
  String get plateRequired;

  /// No description provided for @failedToSaveVehicle.
  ///
  /// In en, this message translates to:
  /// **'Failed to save vehicle'**
  String get failedToSaveVehicle;

  /// No description provided for @editVehicle.
  ///
  /// In en, this message translates to:
  /// **'Edit Vehicle'**
  String get editVehicle;

  /// No description provided for @makeHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Toyota'**
  String get makeHint;

  /// No description provided for @electricVehicle.
  ///
  /// In en, this message translates to:
  /// **'Electric Vehicle'**
  String get electricVehicle;

  /// No description provided for @evAutoDetected.
  ///
  /// In en, this message translates to:
  /// **'EV — auto-detected'**
  String get evAutoDetected;

  /// No description provided for @evNotDetected.
  ///
  /// In en, this message translates to:
  /// **'Not detected as EV'**
  String get evNotDetected;

  /// No description provided for @updateVehicle.
  ///
  /// In en, this message translates to:
  /// **'Update Vehicle'**
  String get updateVehicle;

  /// No description provided for @vehicleTypeMotorcycle.
  ///
  /// In en, this message translates to:
  /// **'Motorcycle'**
  String get vehicleTypeMotorcycle;

  /// No description provided for @passwordChangedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Password changed successfully'**
  String get passwordChangedSuccess;

  /// No description provided for @failedToChangePassword.
  ///
  /// In en, this message translates to:
  /// **'Failed to change password'**
  String get failedToChangePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current Password'**
  String get currentPassword;

  /// No description provided for @currentPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your current password'**
  String get currentPasswordHint;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPassword;

  /// No description provided for @newPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your new password'**
  String get newPasswordHint;

  /// No description provided for @confirmNewPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm New Password'**
  String get confirmNewPassword;

  /// No description provided for @confirmNewPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Re-enter your new password'**
  String get confirmNewPasswordHint;

  /// No description provided for @selectDateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Select date of birth'**
  String get selectDateOfBirth;

  /// No description provided for @dobRequired.
  ///
  /// In en, this message translates to:
  /// **'Date of birth is required'**
  String get dobRequired;

  /// No description provided for @profileUpdatedSuccess.
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully'**
  String get profileUpdatedSuccess;

  /// No description provided for @failedToUpdateProfile.
  ///
  /// In en, this message translates to:
  /// **'Failed to update profile'**
  String get failedToUpdateProfile;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @firstAndLastNameHint.
  ///
  /// In en, this message translates to:
  /// **'First and last name'**
  String get firstAndLastNameHint;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get saveChanges;

  /// No description provided for @allTransactions.
  ///
  /// In en, this message translates to:
  /// **'All Transactions'**
  String get allTransactions;

  /// No description provided for @elapsedTime.
  ///
  /// In en, this message translates to:
  /// **'Elapsed Time'**
  String get elapsedTime;

  /// No description provided for @startedAt.
  ///
  /// In en, this message translates to:
  /// **'Started At'**
  String get startedAt;

  /// No description provided for @slot.
  ///
  /// In en, this message translates to:
  /// **'Slot'**
  String get slot;

  /// No description provided for @levelAndGate.
  ///
  /// In en, this message translates to:
  /// **'Level & Gate'**
  String get levelAndGate;

  /// No description provided for @vehicleLabel.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get vehicleLabel;

  /// No description provided for @endSession.
  ///
  /// In en, this message translates to:
  /// **'End Session'**
  String get endSession;

  /// No description provided for @parkingReceipt.
  ///
  /// In en, this message translates to:
  /// **'Parking Receipt'**
  String get parkingReceipt;

  /// No description provided for @receiptLocation.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get receiptLocation;

  /// No description provided for @receiptAddress.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get receiptAddress;

  /// No description provided for @receiptDateTime.
  ///
  /// In en, this message translates to:
  /// **'Date & Time'**
  String get receiptDateTime;

  /// No description provided for @receiptDuration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get receiptDuration;

  /// No description provided for @receiptSlot.
  ///
  /// In en, this message translates to:
  /// **'Slot'**
  String get receiptSlot;

  /// No description provided for @receiptTotalPaid.
  ///
  /// In en, this message translates to:
  /// **'Total Paid'**
  String get receiptTotalPaid;

  /// No description provided for @downloadPdf.
  ///
  /// In en, this message translates to:
  /// **'Download PDF'**
  String get downloadPdf;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @filterThisMonth.
  ///
  /// In en, this message translates to:
  /// **'This Month'**
  String get filterThisMonth;

  /// No description provided for @filterLast3Months.
  ///
  /// In en, this message translates to:
  /// **'Last 3 Months'**
  String get filterLast3Months;

  /// No description provided for @filterThisYear.
  ///
  /// In en, this message translates to:
  /// **'This Year'**
  String get filterThisYear;

  /// No description provided for @parkingHistory.
  ///
  /// In en, this message translates to:
  /// **'Parking History'**
  String get parkingHistory;

  /// No description provided for @statusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get statusCompleted;

  /// No description provided for @statusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get statusCancelled;

  /// No description provided for @viewReceipt.
  ///
  /// In en, this message translates to:
  /// **'View Receipt'**
  String get viewReceipt;

  /// No description provided for @noReceipt.
  ///
  /// In en, this message translates to:
  /// **'No receipt available'**
  String get noReceipt;

  /// No description provided for @savedPlaces.
  ///
  /// In en, this message translates to:
  /// **'Saved Places'**
  String get savedPlaces;

  /// No description provided for @savedPlacesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your favourite parking spots'**
  String get savedPlacesSubtitle;

  /// No description provided for @savedPlacesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No saved places yet. Save a spot to see it here.'**
  String get savedPlacesEmpty;

  /// No description provided for @monthlySnapshot.
  ///
  /// In en, this message translates to:
  /// **'Monthly Snapshot'**
  String get monthlySnapshot;

  /// No description provided for @recentSessions.
  ///
  /// In en, this message translates to:
  /// **'Recent Sessions'**
  String get recentSessions;

  /// No description provided for @searchDestination.
  ///
  /// In en, this message translates to:
  /// **'Search destination...'**
  String get searchDestination;

  /// No description provided for @activeParkingSession.
  ///
  /// In en, this message translates to:
  /// **'Active Parking Session'**
  String get activeParkingSession;

  /// No description provided for @nearbyParking.
  ///
  /// In en, this message translates to:
  /// **'Nearby Parking'**
  String get nearbyParking;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get viewAll;

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @limitedSpots.
  ///
  /// In en, this message translates to:
  /// **'Limited Spots'**
  String get limitedSpots;

  /// No description provided for @free.
  ///
  /// In en, this message translates to:
  /// **'Free'**
  String get free;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
