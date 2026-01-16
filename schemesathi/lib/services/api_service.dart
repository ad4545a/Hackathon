import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class ApiService {
  // Fetch all schemes with pagination
  static Future<Map<String, dynamic>> fetchSchemes({
    int skip = 0,
    int limit = 100,
    String? search,
  }) async {
    Uri? uri;
    try {
      uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.schemesEndpoint}')
          .replace(queryParameters: {
        'skip': skip.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
      });

      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load schemes: ${response.statusCode}');
      }
    } on SocketException catch (_) {
        throw Exception('Unable to connect to server at $uri. Please check your internet connection.');
    } on TimeoutException catch (_) {
        throw Exception('Connection timed out to $uri. Please check if the server is running and accessible.');
    } catch (e) {
      throw Exception('Unexpected error: $e');
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
    Uri? uri;
    try {
      uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.eligibleEndpoint}');

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
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to fetch eligible schemes: ${response.statusCode}');
      }
    } on SocketException catch (_) {
        throw Exception('Unable to connect to server at $uri. Please check your internet connection.');
    } on TimeoutException catch (_) {
        throw Exception('Connection timed out to $uri. Please check if the server is running and accessible.');
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }
  // Chat with Bot
  static Future<String> chatWithBot({
    required String message,
    required String schemeId,
    String language = 'en',
  }) async {
    Uri? uri;
    try {
      uri = Uri.parse('${ApiConfig.baseUrl}/chat');

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'message': message,
          'scheme_id': schemeId,
          'language': language,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['response'];
      } else {
        throw Exception('Failed to get response: ${response.statusCode}');
      }
    } on SocketException catch (_) {
        throw Exception('Unable to connect to server at $uri.');
    } on TimeoutException catch (_) {
        throw Exception('Connection timed out to $uri.');
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }
}
