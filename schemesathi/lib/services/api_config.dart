class ApiConfig {
  // For Android Emulator, use 10.0.2.2 to access host machine's localhost
  // For physical device, replace with your computer's IP address (e.g., 192.168.1.x)
  static const String baseUrl = 'http://10.0.2.2:8000';
  
  // Endpoints
  static const String schemesEndpoint = '/schemes';
  static const String eligibleEndpoint = '/schemes/eligible';
}
