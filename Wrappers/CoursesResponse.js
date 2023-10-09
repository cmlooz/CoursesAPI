export default class CoursesResponse {
  constructor(data = null, message = null, errors = null) {
    this.succeeded = data !== null;
    this.message = message;
    this.errors = errors;
    this.data = data;
  }

  static success(data, message = null) {
    return new CoursesResponse(data, message);
  }

  static failure(message, errors = null) {
    return new CoursesResponse(null, message, errors);
  }
}
