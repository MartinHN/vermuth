"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isClient = process.env.VUE_APP_ISCLIENT;
var clientSocket = null;
function bindClientSocket(s) {
    if (!isClient) {
        throw new Error(" can't bind client socket on server");
    }
    if (clientSocket !== null) {
        console.error("reassigning socket");
    }
    clientSocket = s;
}
exports.bindClientSocket = bindClientSocket;
function buildAddressFromObj(o) {
    var insp = o;
    var addr = [];
    while (insp) {
        if (insp.accessibleName) {
            addr.push(insp.accessibleName);
        } else if (Array.isArray(insp.accessibleParent)) {
            addr.push("" + insp.accessibleParent.indexOf(insp));
        } else if (insp in Object.values(insp.accessibleParent)) {
            var pair = Object.entries(insp.accessibleParent).find(function(_a) {
                var k = _a[0], v = _a[1];
                return v === insp;
            });
            addr.push(pair[0]);
        } else {
            console.error("");
            debugger;
        }
        insp = insp.accessibleParent;
    }
    if (addr) {
        addr = addr.reverse();
        return "/" + addr.join("/");
    } else {
        throw new Error("can't find address on object" + o);
        return "/noaddress";
    }
}
function DirectRemoteFunction(options) {
    return function(target, propertyKey, descriptor) {
        var method = descriptor.value;
        if (!isClient) {
            if (!target.remoteFunctions) {
                target.remoteFunctions = {};
            }
            target.remoteFunctions[propertyKey] = method;
        }
        descriptor.value = function() {
            // target.notifyRemote()
            if (isClient) {
                if (clientSocket) {
                    var addr = buildAddressFromObj(this) + "/" + propertyKey;
                    clientSocket.emit(addr, arguments);
                } else {
                    console.error("can't reach server on DirectRemoteFunction : ", propertyKey);
                }
            }
            var res;
            if (!options || !options.skipLocal) {
                res = method.apply(this, arguments);
            }
            return res;
        };
    };
}
exports.DirectRemoteFunction = DirectRemoteFunction;
function SetAccessible() {
    return function(target, key) {
        var val = target[key];
        if (!target.accessibleMembers) {
            Object.defineProperty(target, "accessibleMembers", {
                value: {},
                enumerable: true,
                configurable: true,
                writable: true,
            });
        }
        target.accessibleMembers[key] = val;
    };
}
exports.SetAccessible = SetAccessible;
function initAccessibles(parent) {
    for (var _i = 0, _a = Object.keys(parent.accessibleMembers); _i < _a.length; _i++) {
        var k = _a[_i];
        parent[k].accessibleParent = parent;
        parent[k].accessibleName = k;
    }
}
exports.initAccessibles = initAccessibles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyU3luYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL1NlcnZlclN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0FBQzdDLElBQUksWUFBWSxHQUFLLElBQUksQ0FBRTtBQUUzQixTQUFnQixnQkFBZ0IsQ0FBQyxDQUFLO0lBQ3BDLElBQUcsQ0FBQyxRQUFRLEVBQUM7UUFBQyxNQUFNLHFDQUFxQyxDQUFDO0tBQUM7SUFDM0QsSUFBRyxZQUFZLEtBQUcsSUFBSSxFQUFDO1FBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0tBQUM7SUFDN0QsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUNuQixDQUFDO0FBSkQsNENBSUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLENBQUs7SUFDaEMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFBO0lBQ2IsT0FBTSxJQUFJLEVBQUM7UUFDVCxJQUFHLElBQUksQ0FBQyxjQUFjLEVBQUM7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7U0FDL0I7YUFDSSxJQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUM7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1NBQ2xEO2FBQ0ksSUFBRyxJQUFJLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBQztZQUNuRCxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLEVBQUs7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QUMsY0FBYyxHQUFHLENBQUMsQ0FBQTtLQUM3QjtBQUVILENBQUM7QUFORCwwQ0FNQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGlzQ2xpZW50ID0gcHJvY2Vzcy5lbnYuVlVFX0FQUF9JU0NMSUVOVFxubGV0IGNsaWVudFNvY2tldDphbnk9bnVsbCA7XG5cbmV4cG9ydCBmdW5jdGlvbiBiaW5kQ2xpZW50U29ja2V0KHM6YW55KXtcbiAgaWYoIWlzQ2xpZW50KXt0aHJvdyBcIiBjYW4ndCBiaW5kIGNsaWVudCBzb2NrZXQgb24gc2VydmVyXCI7fVxuICBpZihjbGllbnRTb2NrZXQhPT1udWxsKXtjb25zb2xlLmVycm9yKFwicmVhc3NpZ25pbmcgc29ja2V0XCIpO31cbiAgY2xpZW50U29ja2V0ID0gcztcbn1cblxuZnVuY3Rpb24gYnVpbGRBZGRyZXNzRnJvbU9iaihvOmFueSl7XG4gIGxldCBpbnNwID0gbztcbiAgbGV0IGFkZHIgPSBbXVxuICB3aGlsZShpbnNwKXtcbiAgICBpZihpbnNwLmFjY2Vzc2libGVOYW1lKXtcbiAgICAgIGFkZHIucHVzaChpbnNwLmFjY2Vzc2libGVOYW1lKVxuICAgIH1cbiAgICBlbHNlIGlmKEFycmF5LmlzQXJyYXkoaW5zcC5hY2Nlc3NpYmxlUGFyZW50KSl7XG4gICAgICBhZGRyLnB1c2goXCJcIitpbnNwLmFjY2Vzc2libGVQYXJlbnQuaW5kZXhPZihpbnNwKSlcbiAgICB9XG4gICAgZWxzZSBpZihpbnNwIGluIE9iamVjdC52YWx1ZXMoaW5zcC5hY2Nlc3NpYmxlUGFyZW50KSl7XG4gICAgICBjb25zdCBwYWlyID0gT2JqZWN0LmVudHJpZXMoaW5zcC5hY2Nlc3NpYmxlUGFyZW50KS5maW5kKChbayx2XSk9PnY9PT1pbnNwKTtcbiAgICAgIGFkZHIucHVzaChwYWlyWzBdKVxuXG4gICAgfVxuICAgIGVsc2V7XG4gICAgICBjb25zb2xlLmVycm9yKFwiXCIpXG4gICAgICBkZWJ1Z2dlclxuICAgIH1cbiAgICBpbnNwID0gaW5zcC5hY2Nlc3NpYmxlUGFyZW50XG4gIH1cbiAgaWYoYWRkcil7XG4gIGFkZHIgPSBhZGRyLnJldmVyc2UoKVxuICByZXR1cm4gXCIvXCIrYWRkci5qb2luKFwiL1wiKVxuICB9XG4gIGVsc2V7XG4gICAgdGhyb3cgXCJjYW4ndCBmaW5kIGFkZHJlc3Mgb24gb2JqZWN0XCIrbztcbiAgICByZXR1cm4gXCIvbm9hZGRyZXNzXCI7XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gRGlyZWN0UmVtb3RlRnVuY3Rpb24ob3B0aW9ucz86e3NraXBMb2NhbD86Ym9vbGVhbn0pe1xuICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDphbnksIHByb3BlcnR5S2V5OiBzdHJpbmcsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIGxldCBtZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgIGlmKCFpc0NsaWVudCl7XG4gICAgICBpZighdGFyZ2V0LnJlbW90ZUZ1bmN0aW9ucyl7XG4gICAgICAgIHRhcmdldC5yZW1vdGVGdW5jdGlvbnMgPSB7fVxuICAgICAgfVxuICAgICAgdGFyZ2V0LnJlbW90ZUZ1bmN0aW9uc1twcm9wZXJ0eUtleV0gPSBtZXRob2RcbiAgICB9XG4gICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHRhcmdldC5ub3RpZnlSZW1vdGUoKVxuICAgICAgaWYoaXNDbGllbnQpe1xuICAgICAgICBpZihjbGllbnRTb2NrZXQpe1xuICAgICAgICAgIGNvbnN0IGFkZHIgPSBidWlsZEFkZHJlc3NGcm9tT2JqKHRoaXMpK1wiL1wiK3Byb3BlcnR5S2V5O1xuICAgICAgICAgIGNsaWVudFNvY2tldC5lbWl0KGFkZHIsYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcImNhbid0IHJlYWNoIHNlcnZlciBvbiBEaXJlY3RSZW1vdGVGdW5jdGlvbiA6IFwiLHByb3BlcnR5S2V5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgcmVzO1xuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMuc2tpcExvY2FsKXtcbiAgICAgICAgcmVzID0gbWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfVxuICB9XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gU2V0QWNjZXNzaWJsZSgpe1xuXG4gIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OmFueSwga2V5OiBzdHJpbmcgfCBzeW1ib2wpIHtcbiAgICBsZXQgdmFsID0gdGFyZ2V0W2tleV1cbiAgICBpZighdGFyZ2V0LmFjY2Vzc2libGVNZW1iZXJzKXtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIFwiYWNjZXNzaWJsZU1lbWJlcnNcIiwge1xuICAgICAgICB2YWx1ZTp7fSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgdGFyZ2V0LmFjY2Vzc2libGVNZW1iZXJzW2tleV0gPSB2YWxcblxuXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBY2Nlc3NpYmxlcyhwYXJlbnQpe1xuICBmb3IoY29uc3QgayBvZiBPYmplY3Qua2V5cyhwYXJlbnQuYWNjZXNzaWJsZU1lbWJlcnMpKXtcbiAgICBwYXJlbnRba10uYWNjZXNzaWJsZVBhcmVudCA9IHBhcmVudFxuICAgIHBhcmVudFtrXS5hY2Nlc3NpYmxlTmFtZSA9IGtcbiAgfVxuXG59Il19
