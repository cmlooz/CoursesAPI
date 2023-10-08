export default class CoursesRequest {
  constructor(process, action, data, parameters, user) {
    this.process = process;
    this.action = action;
    this.data = data;
    this.parameters = parameters;
    this.user = user;
  }
}
