import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class ApiService {
  // Fetch all schemes with pagination
  static Future<Map<String, dynamic>> fetchSchemes({
    int skip = 0,
    int limit = 100,
    String? search,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.schemesEndpoint}')
          .replace(queryParameters: {
        'skip': skip.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
      });

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load schemes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Fetch eligible schemes based on user profile
  static Future<List<dynamic>> fetchEligibleSchemes({
    required int age,
    required int income,
    required String caste,
    required String occupation,
    required String state,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.eligibleEndpoint}');

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'age': age,
          'income': income,
          'caste': caste,
          'occupation': occupation,
          'state': state,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to fetch eligible schemes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
