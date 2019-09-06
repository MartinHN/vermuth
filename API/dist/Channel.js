"use strict";
var __extends = (this && this.__extends) || (function() {
    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function(d, b) { d.__proto__ = b; }) ||
            function(d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
        return extendStatics(d, b);
    };
    return function(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") { r = Reflect.decorate(decorators, target, key, desc); } else { for (var i = decorators.length - 1; i >= 0; i--) { if (d = decorators[i]) { r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r; } } }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
var ServerSync_1 = require("./ServerSync");
var channelTypes = {};
var ChannelBase = /** @class */ (function() {
    function ChannelBase(name, __value, circ, _enabled) {
        if (__value === void 0) { __value = 0; }
        if (circ === void 0) { circ = 0; }
        if (_enabled === void 0) { _enabled = true; }
        this.name = name;
        this.__value = __value;
        this.circ = circ;
        this._enabled = _enabled;
        this.ctype = "base";
        this.hasDuplicatedCirc = false;
        this.reactToMaster = true;
    }
    Object.defineProperty(ChannelBase.prototype, "trueCirc", {
        get: function() {
            var baseCirc = 0;
            if (this.__parentFixture && this.__parentFixture.baseCirc) {
                baseCirc = this.__parentFixture.baseCirc;
            }
            return baseCirc + this.circ;
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(ChannelBase.prototype, "intValue", {
        get: function() { return this.__value * 255; },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(ChannelBase.prototype, "floatValue", {
        get: function() { return this.__value; },
        enumerable: true,
        configurable: true,
    });
    ChannelBase.createFromObj = function(ob) {
        var cstr = channelTypes[ob.ctype];
        if (cstr) {
            var c = new cstr(ob.name, ob.value, ob.circ);
            c.configFromObj(ob);
            return c;
        } else {
            return undefined;
        }
    };
    Object.defineProperty(ChannelBase.prototype, "enabled", {
        get: function() {
            return this._enabled;
        },
        set: function(v) {
            this._enabled = v;
        },
        enumerable: true,
        configurable: true,
    });
    ChannelBase.prototype.configFromObj = function(ob) {
        if (ob.name) {
            this.name = ob.name;
        }
        if (ob.value) {
            this.setValue(ob.value, false);
        }
        if (ob.circ) {
            this.setCirc(ob.circ);
        }
        if (ob.reactToMaster) {
            this.reactToMaster = ob.reactToMaster;
        }
    };
    ChannelBase.prototype.setValue = function(v, doNotify) {
        return this.setFloatValue(v, doNotify);
    };
    ChannelBase.prototype.setFloatValue = function(v, doNotify) {
        if (this.__value !== v) {
            this.__value = v;
            if (doNotify) {
                exports.UniverseListener.notify(this.trueCirc, this.__value);
            }
            return true;
        } else {
            return false;
        }
    };
    ChannelBase.prototype.setIntValue = function(nvalue, doNotify) {
        return this.setFloatValue(nvalue / 255, doNotify);
    };
    ChannelBase.prototype.setCirc = function(n) {
        this.circ = n;
        this.checkDuplicatedCirc();
    };
    ChannelBase.prototype.setName = function(n) {
        this.name = n;
        this.reactToMaster = !["r", "g", "b"].includes(this.name);
        this.checkNameDuplicate();
    };
    ChannelBase.prototype.checkNameDuplicate = function() {
        var _this = this;
        if (this.__parentFixture) {
            this.name = Utils_1.getNextUniqueName(this.__parentFixture.channels.filter(function(c) { return c !== _this; }).map(function(c) { return c.name; }), this.name);
        }
    };
    ChannelBase.prototype.setValueInternal = function(v) { return true; };
    ChannelBase.prototype.setParentFixture = function(f) {
        this.__parentFixture = f;
        this.checkNameDuplicate();
        this.checkDuplicatedCirc();
    };
    ChannelBase.prototype.checkDuplicatedCirc = function() {
        if (this.__parentFixture && this.__parentFixture.universe) {
            for (var _i = 0, _a = this.__parentFixture.universe.fixtureList; _i < _a.length; _i++) {
                var f = _a[_i];
                for (var _b = 0, _c = f.channels; _b < _c.length; _b++) {
                    var cc = _c[_b];
                    if (this !== cc && cc.trueCirc === this.trueCirc) {
                        this.hasDuplicatedCirc = true;
                        return;
                    }
                }
            }
        }
        this.hasDuplicatedCirc = false;
    };
    __decorate([
        ServerSync_1.DirectRemoteFunction(),
    ], ChannelBase.prototype, "setValue", null);
    return ChannelBase;
}());
exports.ChannelBase = ChannelBase;
// register type
channelTypes.base = ChannelBase.prototype.constructor;
var LogChannel = /** @class */ (function(_super) {
    __extends(LogChannel, _super);
    function LogChannel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ctype = "logChanel";
        return _this;
    }
    LogChannel.prototype.setValueInternal = function(v) {
        console.log("set channel" + v);
        return true;
    };
    return LogChannel;
}(ChannelBase));
exports.LogChannel = LogChannel;
var EventEmitter = require("events");
var UniverseListenerClass = /** @class */ (function(_super) {
    __extends(UniverseListenerClass, _super);
    function UniverseListenerClass() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.listener = function() { };
        return _this;
    }
    UniverseListenerClass.prototype.setListener = function(f) {
        this.listener = f;
    };
    UniverseListenerClass.prototype.notify = function(c, v) {
        this.emit("channelChanged", c, v);
    };
    return UniverseListenerClass;
}(EventEmitter));
exports.UniverseListener = new UniverseListenerClass();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhbm5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL0NoYW5uZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQTRDO0FBRTVDLDJDQUFtRDtBQW9CbkQsSUFBTSxZQUFZLEdBQXlDLEVBQUUsQ0FBQztBQUU5RDtJQTBDRSxxQkFBbUIsSUFBWSxFQUFVLE9BQTZCLEVBQVUsSUFBZSxFQUFTLFFBQXVCO1FBQXRGLHdCQUFBLEVBQUEsV0FBNkI7UUFBVSxxQkFBQSxFQUFBLFFBQWU7UUFBUyx5QkFBQSxFQUFBLGVBQXVCO1FBQTVHLFNBQUksR0FBSixJQUFJLENBQVE7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFzQjtRQUFVLFNBQUksR0FBSixJQUFJLENBQVc7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFlO1FBTnhILFVBQUssR0FBRyxNQUFNLENBQUM7UUFDZixzQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDMUIsa0JBQWEsR0FBRyxJQUFJLENBQUM7SUFNNUIsQ0FBQztJQTFDRCxzQkFBSSxpQ0FBUTthQUFaO1lBQ0UsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRTtnQkFDekQsUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDO2FBQzFDO1lBQ0QsT0FBTyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUM5QixDQUFDOzs7T0FBQTtJQUNELHNCQUFJLGlDQUFRO2FBQVosY0FBZ0IsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzVDLHNCQUFJLG1DQUFVO2FBQWQsY0FBa0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFMUIseUJBQWEsR0FBM0IsVUFBNEIsRUFBTztRQUNqQyxJQUFNLElBQUksR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBTSxDQUFDLEdBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ25CLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7YUFBTTtZQUNMLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztJQUNELHNCQUFXLGdDQUFPO2FBR2xCO1lBQ0UsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUM7YUFMRCxVQUFtQixDQUFTO1lBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFBO1FBQ25CLENBQUM7OztPQUFBO0lBS00sbUNBQWEsR0FBcEIsVUFBcUIsRUFBTTtRQUN6QixJQUFHLEVBQUUsQ0FBQyxJQUFJO1lBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQy9CLElBQUcsRUFBRSxDQUFDLEtBQUs7WUFBQyxJQUFJLENBQUMsUUFBUSxDQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBRyxFQUFFLENBQUMsSUFBSTtZQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUcsRUFBRSxDQUFDLGFBQWE7WUFBQyxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDNUQsQ0FBQztJQWFNLDhCQUFRLEdBQWYsVUFBZ0IsQ0FBbUIsRUFBRSxRQUFpQjtRQUNwRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFDTSxtQ0FBYSxHQUFwQixVQUFxQixDQUFTLEVBQUUsUUFBaUI7UUFDL0MsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLFFBQVEsRUFBRTtnQkFBQyx3QkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFBRTtZQUN0RSxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVNLGlDQUFXLEdBQWxCLFVBQW1CLE1BQWMsRUFBRSxRQUFpQjtRQUNsRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sNkJBQU8sR0FBZCxVQUFlLENBQVM7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRU0sNkJBQU8sR0FBZCxVQUFnQixDQUFTO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBRTVCLENBQUM7SUFDTSx3Q0FBa0IsR0FBekI7UUFBQSxpQkFJQztRQUhDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4QixJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBRSxVQUFDLENBQWMsSUFBSyxPQUFBLENBQUMsS0FBSyxLQUFJLEVBQVYsQ0FBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBYyxJQUFLLE9BQUEsQ0FBQyxDQUFDLElBQUksRUFBTixDQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDako7SUFDSCxDQUFDO0lBRU0sc0NBQWdCLEdBQXZCLFVBQXdCLENBQW1CLElBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRXJELHNDQUFnQixHQUF2QixVQUF3QixDQUFtQjtRQUN6QyxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRU0seUNBQW1CLEdBQTFCO1FBQ0UsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFHO1lBQzFELEtBQWlCLFVBQXlDLEVBQXpDLEtBQUEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUF6QyxjQUF5QyxFQUF6QyxJQUF5QyxFQUFFO2dCQUF0RCxJQUFNLENBQUMsU0FBQTtnQkFDWCxLQUFrQixVQUFVLEVBQVYsS0FBQSxDQUFDLENBQUMsUUFBUSxFQUFWLGNBQVUsRUFBVixJQUFVLEVBQUU7b0JBQXhCLElBQU0sRUFBRSxTQUFBO29CQUNaLElBQUssSUFBSSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUU7d0JBQ2pELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7d0JBQUMsT0FBTztxQkFDdkM7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQUNqQyxDQUFDO0lBckREO1FBREMsaUNBQW9CLEVBQUU7K0NBR3RCO0lBc0RILGtCQUFDO0NBQUEsQUF2R0QsSUF1R0M7QUF2R1ksa0NBQVc7QUF3R3hCLGdCQUFnQjtBQUNoQixZQUFZLENBQUMsSUFBSSxHQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsV0FBa0QsQ0FBQztBQUc5RjtJQUFnQyw4QkFBVztJQUEzQztRQUFBLHFFQU9DO1FBTlEsV0FBSyxHQUFHLFdBQVcsQ0FBQzs7SUFNN0IsQ0FBQztJQUxRLHFDQUFnQixHQUF2QixVQUF5QixDQUFtQjtRQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFSCxpQkFBQztBQUFELENBQUMsQUFQRCxDQUFnQyxXQUFXLEdBTzFDO0FBUFksZ0NBQVU7QUFTdkIsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFFLFFBQVEsQ0FBRSxDQUFDO0FBQ3pDO0lBQW9DLHlDQUFZO0lBQWhEO1FBQUEscUVBU0M7UUFEUyxjQUFRLEdBQW1DLGNBQU8sQ0FBQyxDQUFDOztJQUM5RCxDQUFDO0lBUlEsMkNBQVcsR0FBbEIsVUFBbUIsQ0FBaUM7UUFDbEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUNNLHNDQUFNLEdBQWIsVUFBYyxDQUFTLEVBQUUsQ0FBUztRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVwQyxDQUFDO0lBRUgsNEJBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBb0MsWUFBWSxHQVMvQztBQUNZLFFBQUEsZ0JBQWdCLEdBQUcsSUFBSSxxQkFBcUIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0TmV4dFVuaXF1ZU5hbWUgfSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IEZpeHR1cmVCYXNlIH0gZnJvbSAnLi9GaXh0dXJlJztcbmltcG9ydCB7IERpcmVjdFJlbW90ZUZ1bmN0aW9uIH0gZnJvbSAnLi9TZXJ2ZXJTeW5jJ1xudHlwZSBDaGFubmVsVmFsdWVUeXBlID0gbnVtYmVyOyAvLyB8bnVtYmVyW107XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhbm5lbEkge1xuICBjdHlwZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIC8vIHByaXZhdGUgX192YWx1ZTogQ2hhbm5lbFZhbHVlVHlwZTtcbiAgX2VuYWJsZWQ6IGJvb2xlYW47XG4gIGNpcmM6IG51bWJlcjtcblxuICBzZXRWYWx1ZSh2OiBDaGFubmVsVmFsdWVUeXBlLCBkb05vdGlmeTogYm9vbGVhbik6IGJvb2xlYW47XG4gIHNldFZhbHVlSW50ZXJuYWwodjogQ2hhbm5lbFZhbHVlVHlwZSk6IGJvb2xlYW47XG5cbn1cblxuXG5cbnR5cGUgQ2hhbm5lbENvbnN0cnVjdG9ySSAgPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBDaGFubmVsQmFzZTtcblxuXG5jb25zdCBjaGFubmVsVHlwZXM6IHtba2V5OiBzdHJpbmddOiBDaGFubmVsQ29uc3RydWN0b3JJfSA9IHt9O1xuXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEJhc2UgaW1wbGVtZW50cyBDaGFubmVsSSB7XG5cbiAgZ2V0IHRydWVDaXJjKCkge1xuICAgIGxldCBiYXNlQ2lyYyA9IDA7XG4gICAgaWYgKHRoaXMuX19wYXJlbnRGaXh0dXJlICYmIHRoaXMuX19wYXJlbnRGaXh0dXJlLmJhc2VDaXJjKSB7XG4gICAgICBiYXNlQ2lyYyA9IHRoaXMuX19wYXJlbnRGaXh0dXJlLmJhc2VDaXJjO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZUNpcmMgKyB0aGlzLmNpcmM7XG4gIH1cbiAgZ2V0IGludFZhbHVlKCkge3JldHVybiB0aGlzLl9fdmFsdWUgKiAyNTU7IH1cbiAgZ2V0IGZsb2F0VmFsdWUoKSB7cmV0dXJuIHRoaXMuX192YWx1ZTsgfVxuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRnJvbU9iaihvYjogYW55KTogQ2hhbm5lbEJhc2V8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBjc3RyID0gY2hhbm5lbFR5cGVzW29iLmN0eXBlXTtcbiAgICBpZiAoY3N0cikge1xuICAgICAgY29uc3QgYyA9ICBuZXcgY3N0cihvYi5uYW1lLCBvYi52YWx1ZSwgb2IuY2lyYyk7XG4gICAgICBjLmNvbmZpZ0Zyb21PYmoob2IpXG4gICAgICByZXR1cm4gYztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbiAgcHVibGljIHNldCBlbmFibGVkKHY6Ym9vbGVhbil7XG4gICAgdGhpcy5fZW5hYmxlZCA9IHZcbiAgfVxuICBwdWJsaWMgZ2V0IGVuYWJsZWQoKXtcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgfVxuXG4gIHB1YmxpYyBjb25maWdGcm9tT2JqKG9iOmFueSl7XG4gICAgaWYob2IubmFtZSl0aGlzLm5hbWUgPSBvYi5uYW1lO1xuICAgIGlmKG9iLnZhbHVlKXRoaXMuc2V0VmFsdWUoIG9iLnZhbHVlLGZhbHNlKTtcbiAgICBpZihvYi5jaXJjKXRoaXMuc2V0Q2lyYyggb2IuY2lyYyk7XG4gICAgaWYob2IucmVhY3RUb01hc3Rlcil0aGlzLnJlYWN0VG9NYXN0ZXIgPSBvYi5yZWFjdFRvTWFzdGVyO1xuICB9XG5cbiAgcHVibGljIGN0eXBlID0gJ2Jhc2UnO1xuICBwdWJsaWMgaGFzRHVwbGljYXRlZENpcmMgPSBmYWxzZTtcbiAgcHVibGljIHJlYWN0VG9NYXN0ZXIgPSB0cnVlO1xuICBwcml2YXRlIF9fcGFyZW50Rml4dHVyZTogYW55O1xuXG5cbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHJpdmF0ZSBfX3ZhbHVlOiBDaGFubmVsVmFsdWVUeXBlID0gMCAsIHB1YmxpYyBjaXJjOiBudW1iZXI9IDAsIHB1YmxpYyBfZW5hYmxlZDogYm9vbGVhbj0gdHJ1ZSkge1xuXG4gIH1cblxuICBARGlyZWN0UmVtb3RlRnVuY3Rpb24oKVxuICBwdWJsaWMgc2V0VmFsdWUodjogQ2hhbm5lbFZhbHVlVHlwZSwgZG9Ob3RpZnk6IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gdGhpcy5zZXRGbG9hdFZhbHVlKHYsIGRvTm90aWZ5KTtcbiAgfVxuICBwdWJsaWMgc2V0RmxvYXRWYWx1ZSh2OiBudW1iZXIsIGRvTm90aWZ5OiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX192YWx1ZSAhPT0gdikge1xuICAgICAgdGhpcy5fX3ZhbHVlID0gdjtcbiAgICAgIGlmIChkb05vdGlmeSkge1VuaXZlcnNlTGlzdGVuZXIubm90aWZ5KHRoaXMudHJ1ZUNpcmMsIHRoaXMuX192YWx1ZSk7IH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldEludFZhbHVlKG52YWx1ZTogbnVtYmVyLCBkb05vdGlmeTogYm9vbGVhbikge1xuICAgIHJldHVybiB0aGlzLnNldEZsb2F0VmFsdWUobnZhbHVlIC8gMjU1LCBkb05vdGlmeSk7XG4gIH1cblxuICBwdWJsaWMgc2V0Q2lyYyhuOiBudW1iZXIpIHtcbiAgICB0aGlzLmNpcmMgPSBuO1xuICAgIHRoaXMuY2hlY2tEdXBsaWNhdGVkQ2lyYygpO1xuICB9XG5cbiAgcHVibGljIHNldE5hbWUoIG46IHN0cmluZyApIHtcbiAgICB0aGlzLm5hbWUgPSBuO1xuICAgIHRoaXMucmVhY3RUb01hc3RlciA9ICFbJ3InLCAnZycsICdiJ10uaW5jbHVkZXModGhpcy5uYW1lKTtcbiAgICB0aGlzLmNoZWNrTmFtZUR1cGxpY2F0ZSgpO1xuXG4gIH1cbiAgcHVibGljIGNoZWNrTmFtZUR1cGxpY2F0ZSgpIHtcbiAgICBpZiAodGhpcy5fX3BhcmVudEZpeHR1cmUpIHtcbiAgICAgIHRoaXMubmFtZSA9IGdldE5leHRVbmlxdWVOYW1lKHRoaXMuX19wYXJlbnRGaXh0dXJlLmNoYW5uZWxzLmZpbHRlciggKGM6IENoYW5uZWxCYXNlKSA9PiBjICE9PSB0aGlzKS5tYXAoKGM6IENoYW5uZWxCYXNlKSA9PiBjLm5hbWUpLCB0aGlzLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRWYWx1ZUludGVybmFsKHY6IENoYW5uZWxWYWx1ZVR5cGUpIHtyZXR1cm4gdHJ1ZTsgfVxuXG4gIHB1YmxpYyBzZXRQYXJlbnRGaXh0dXJlKGY6IEZpeHR1cmVCYXNlfG51bGwpIHtcbiAgICB0aGlzLl9fcGFyZW50Rml4dHVyZSA9IGY7XG4gICAgdGhpcy5jaGVja05hbWVEdXBsaWNhdGUoKTtcbiAgICB0aGlzLmNoZWNrRHVwbGljYXRlZENpcmMoKTtcbiAgfVxuXG4gIHB1YmxpYyBjaGVja0R1cGxpY2F0ZWRDaXJjKCkge1xuICAgIGlmICh0aGlzLl9fcGFyZW50Rml4dHVyZSAmJiB0aGlzLl9fcGFyZW50Rml4dHVyZS51bml2ZXJzZSApIHtcbiAgICAgIGZvciAoIGNvbnN0IGYgb2YgdGhpcy5fX3BhcmVudEZpeHR1cmUudW5pdmVyc2UuZml4dHVyZUxpc3QpIHtcbiAgICAgICAgZm9yICggY29uc3QgY2Mgb2YgZi5jaGFubmVscykge1xuICAgICAgICAgIGlmICggdGhpcyAhPT0gY2MgJiYgY2MudHJ1ZUNpcmMgPT09IHRoaXMudHJ1ZUNpcmMpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzRHVwbGljYXRlZENpcmMgPSB0cnVlOyByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaGFzRHVwbGljYXRlZENpcmMgPSBmYWxzZTtcbiAgfVxuXG5cbn1cbi8vIHJlZ2lzdGVyIHR5cGVcbmNoYW5uZWxUeXBlcy5iYXNlID0gIENoYW5uZWxCYXNlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciBhcyBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBDaGFubmVsQmFzZTtcblxuXG5leHBvcnQgY2xhc3MgTG9nQ2hhbm5lbCBleHRlbmRzIENoYW5uZWxCYXNlIHtcbiAgcHVibGljIGN0eXBlID0gJ2xvZ0NoYW5lbCc7XG4gIHB1YmxpYyBzZXRWYWx1ZUludGVybmFsKCB2OiBDaGFubmVsVmFsdWVUeXBlKSB7XG4gICAgY29uc29sZS5sb2coJ3NldCBjaGFubmVsJyArIHYpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbn1cblxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSggJ2V2ZW50cycgKTtcbmNsYXNzIFVuaXZlcnNlTGlzdGVuZXJDbGFzcyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIHB1YmxpYyBzZXRMaXN0ZW5lcihmOiAoYzogbnVtYmVyLCB2OiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gZjtcbiAgfVxuICBwdWJsaWMgbm90aWZ5KGM6IG51bWJlciwgdjogbnVtYmVyKSB7XG4gICAgdGhpcy5lbWl0KCdjaGFubmVsQ2hhbmdlZCcsIGMsIHYpO1xuXG4gIH1cbiAgcHJpdmF0ZSBsaXN0ZW5lcjogKGM6IG51bWJlciwgdjogbnVtYmVyKSA9PiB2b2lkID0gKCkgPT4ge307XG59XG5leHBvcnQgY29uc3QgVW5pdmVyc2VMaXN0ZW5lciA9IG5ldyBVbml2ZXJzZUxpc3RlbmVyQ2xhc3MoKTtcblxuXG5cblxuXG4iXX0=
