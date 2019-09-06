"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isClient = process.env.VUE_APP_ISCLIENT;
function RemoteFunction1(options) {
    return function(target, propertyKey, descriptor) {
        var method = descriptor.value;
        console.log("eval");
        descriptor.value = function() {
            // target.notifyRemote()
            console.log("caled");
            return method.apply(this, arguments);
        };
    };
}
exports.RemoteFunction1 = RemoteFunction1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL0RlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0FBRTdDLFNBQWdCLGVBQWUsQ0FBQyxPQUFZO0lBQzFDLE9BQU8sVUFBVSxNQUFVLEVBQUUsV0FBbUIsRUFBRSxVQUE4QjtRQUM5RSxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDbkIsVUFBVSxDQUFDLEtBQUssR0FBRztZQUNmLHdCQUF3QjtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3BCLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQVZELDBDQVVDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaXNDbGllbnQgPSBwcm9jZXNzLmVudi5WVUVfQVBQX0lTQ0xJRU5UXG5cbmV4cG9ydCBmdW5jdGlvbiBSZW1vdGVGdW5jdGlvbjEob3B0aW9ucz86YW55KXtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6YW55LCBwcm9wZXJ0eUtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICBsZXQgbWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICBjb25zb2xlLmxvZygnZXZhbCcpXG4gICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gdGFyZ2V0Lm5vdGlmeVJlbW90ZSgpXG4gICAgICAgIGNvbnNvbGUubG9nKCdjYWxlZCcpXG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cbn0iXX0=
