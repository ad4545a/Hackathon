import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  static const String keyLanguageSelected = 'language_selected';
  static const String keyOnboardingCompleted = 'onboarding_completed';
  static const String keyIsLoggedIn = 'is_logged_in';

  // --- Getters ---

  static Future<bool> isLanguageSelected() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(keyLanguageSelected) ?? false;
  }

  static Future<bool> isOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(keyOnboardingCompleted) ?? false;
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(keyIsLoggedIn) ?? false;
  }

  // --- Setters ---

  static Future<void> setLanguageSelected(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyLanguageSelected, value);
  }

  static Future<void> setOnboardingCompleted(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyOnboardingCompleted, value);
  }

  static Future<void> setLoggedIn(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyIsLoggedIn, value);
  }

  // --- Reset (Logout) ---
  
  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear(); // Clears everything
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    // Requirements: "is_logged_in = false, language_selected = false, onboarding_completed = false"
    await prefs.setBool(keyIsLoggedIn, false);
    await prefs.setBool(keyLanguageSelected, false); // As requested
    await prefs.setBool(keyOnboardingCompleted, false); // As requested
    // Or just clear() if you want to wipe everything including user details
    // await prefs.clear(); 
  }
}
