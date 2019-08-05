"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Channel_1 = require("./Channel");
var EventEmitter = require('events').EventEmitter;
var ServerSync_1 = require("./ServerSync");
var fixtureTypes = {};
var FixtureBase = /** @class */ (function () {
    function FixtureBase(name, channels) {
        var _this = this;
        this.name = name;
        this.enabled = true;
        this.globalValue = 0;
        this.ftype = 'base';
        this._baseCirc = 0;
        this.events = new EventEmitter();
        this.channels = new Array();
        channels.map(function (c) { return _this.addChannel(c); });
        ServerSync_1.initAccessibles(this);
    }
    FixtureBase.createFromObj = function (ob) {
        if (ob.channels) {
            var cstr = fixtureTypes[ob.ftype];
            if (cstr) {
                var i = cstr(ob.name, []);
                i.configureFromObj(ob);
                return i;
            }
            else {
                return undefined;
            }
        }
    };
    FixtureBase.prototype.configureFromObj = function (ob) {
        var _this = this;
        if (ob.baseCirc)
            this.baseCirc = ob.baseCirc;
        if (ob.channels) {
            this.channels.map(function (c) { return _this.removeChannel(c); });
            ob.channels.map(function (c) { return _this.addChannel(Channel_1.ChannelBase.createFromObj(c)); });
        }
    };
    Object.defineProperty(FixtureBase.prototype, "baseCirc", {
        get: function () { return this._baseCirc; },
        set: function (n) {
            this._baseCirc = n;
            this.channels.map(function (c) { return c.checkDuplicatedCirc(); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FixtureBase.prototype, "inSync", {
        get: function () {
            for (var _i = 0, _a = this.channels.filter(function (cc) { return cc.reactToMaster; }); _i < _a.length; _i++) {
                var c = _a[_i];
                if (c.floatValue !== this.globalValue) {
                    return false;
                }
            }
            return true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FixtureBase.prototype, "universe", {
        get: function () {
            return this.__universe;
        },
        set: function (uni) {
            var _this = this;
            this.__universe = uni;
            this.channels.map(function (c) { return c.setParentFixture(_this); });
        },
        enumerable: true,
        configurable: true
    });
    FixtureBase.prototype.setName = function (n) {
        var oldName = this.name;
        this.name = n;
        if (oldName !== n) {
            this.events.emit('nameChanged', this, oldName);
        }
    };
    FixtureBase.prototype.buildAddress = function () {
        return "/mainUniverse/" + this.name;
    };
    FixtureBase.prototype.setMaster = function (v) {
        this.globalValue = v;
        this.syncToGlobalValue(v);
    };
    FixtureBase.prototype.syncToGlobalValue = function (v) {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.reactToMaster) {
                c.setValue(v, true);
            }
        }
    };
    FixtureBase.prototype.addChannel = function (c) {
        if (c === undefined) {
            c = new Channel_1.ChannelBase('channel', 0, 0, true);
        }
        c.setParentFixture(this);
        this.channels.push(c);
        return c;
    };
    FixtureBase.prototype.removeChannel = function (c) {
        c.setParentFixture(null);
        var i = this.channels.indexOf(c);
        if (i >= 0)
            this.channels.splice(i, 1); // = this.channels.filter((v) => c !== v); // delete?
    };
    FixtureBase.prototype.getChannelForName = function (n) {
        return this.channels.find(function (c) { return c.name === n; });
    };
    Object.defineProperty(FixtureBase.prototype, "channelNames", {
        get: function () {
            return this.channels.map(function (c) { return c.name; });
        },
        enumerable: true,
        configurable: true
    });
    __decorate([
        ServerSync_1.SetAccessible()
    ], FixtureBase.prototype, "channels", void 0);
    __decorate([
        ServerSync_1.DirectRemoteFunction()
    ], FixtureBase.prototype, "setMaster", null);
    return FixtureBase;
}());
exports.FixtureBase = FixtureBase;
var DirectFixture = /** @class */ (function (_super) {
    __extends(DirectFixture, _super);
    function DirectFixture(channelName, circs) {
        var _this = _super.call(this, channelName, circs.map(function (c) { return new Channel_1.ChannelBase('channel', 0, c); })) || this;
        _this.ftype = 'direct';
        return _this;
    }
    return DirectFixture;
}(FixtureBase));
exports.DirectFixture = DirectFixture;
fixtureTypes.direct = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new DirectFixture(args[0], args[1]);
};
console.log('started');
var f = new DirectFixture('lala', [0]);
console.log("setName");
f.setName("lala");
// const  allCircs  = new Array(512).fill(0).map((_, idx) => idx);
// export const fixtureAll = new DirectFixture('all', allCircs);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRml4dHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL0ZpeHR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXdDO0FBR3hDLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDcEQsMkNBQWlGO0FBUWpGLElBQU0sWUFBWSxHQUF5QyxFQUFFLENBQUM7QUFFOUQ7SUFjRSxxQkFBbUIsSUFBWSxFQUFFLFFBQXVCO1FBQXhELGlCQUdDO1FBSGtCLFNBQUksR0FBSixJQUFJLENBQVE7UUFWeEIsWUFBTyxHQUFHLElBQUksQ0FBQztRQUNmLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsVUFBSyxHQUFHLE1BQU0sQ0FBQztRQUNqQixjQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWYsV0FBTSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUE7UUFHbEIsYUFBUSxHQUFHLElBQUksS0FBSyxFQUFlLENBQUE7UUFHakQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBRSxPQUFBLEtBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQWxCLENBQWtCLENBQUMsQ0FBQTtRQUNuQyw0QkFBZSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZCLENBQUM7SUFFYSx5QkFBYSxHQUEzQixVQUE0QixFQUFPO1FBQ2pDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtZQUNmLElBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzVCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFFdEIsT0FBTyxDQUFDLENBQUM7YUFDVjtpQkFBTTtn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aUNBQW9CLEVBQUU7Z0RBSXRCO0lBbUNILGtCQUFDO0NBQUEsQUF6SEQsSUF5SEM7QUF6SFksa0NBQVc7QUE0SHhCO0lBQW1DLGlDQUFXO0lBRTVDLHVCQUFhLFdBQW1CLEVBQUcsS0FBZTtRQUFsRCxZQUNFLGtCQUFNLFdBQVcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsSUFBSSxxQkFBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQWhDLENBQWdDLENBQUMsQ0FBQyxTQUd2RTtRQUZDLEtBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDOztJQUV4QixDQUFDO0lBRUgsb0JBQUM7QUFBRCxDQUFDLEFBUkQsQ0FBbUMsV0FBVyxHQVE3QztBQVJZLHNDQUFhO0FBUzFCLFlBQVksQ0FBQyxNQUFNLEdBQUc7SUFBQyxjQUFjO1NBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztRQUFkLHlCQUFjOztJQUFLLE9BQUEsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFuQyxDQUFtQyxDQUFDO0FBRzlFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDdEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3RCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDakIsa0VBQWtFO0FBQ2xFLGdFQUFnRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5uZWxCYXNlIH0gZnJvbSAnLi9DaGFubmVsJztcbmltcG9ydCB7IFVuaXZlcnNlIH0gZnJvbSAnLi9Vbml2ZXJzZSc7XG5pbXBvcnQgeyBnZXROZXh0VW5pcXVlTmFtZSB9IGZyb20gJy4vVXRpbHMnO1xuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuaW1wb3J0IHsgRGlyZWN0UmVtb3RlRnVuY3Rpb24sU2V0QWNjZXNzaWJsZSxpbml0QWNjZXNzaWJsZXMgfSBmcm9tIFwiLi9TZXJ2ZXJTeW5jXCJcblxudHlwZSBDaGFubmVsVmFsdWVUeXBlID0gQ2hhbm5lbEJhc2VbJ19fdmFsdWUnXTtcbmludGVyZmFjZSBGaXh0dXJlQmFzZUkge1xuICBuYW1lOiBzdHJpbmc7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG59XG50eXBlIEZpeHR1cmVDb25zdHJ1Y3RvckkgID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBGaXh0dXJlQmFzZTtcbmNvbnN0IGZpeHR1cmVUeXBlczoge1trZXk6IHN0cmluZ106IEZpeHR1cmVDb25zdHJ1Y3Rvckl9ID0ge307XG5cbmV4cG9ydCBjbGFzcyBGaXh0dXJlQmFzZSBpbXBsZW1lbnRzIEZpeHR1cmVCYXNlSSB7XG5cblxuICBcbiAgcHVibGljIGVuYWJsZWQgPSB0cnVlO1xuICBwdWJsaWMgZ2xvYmFsVmFsdWUgPSAwO1xuICBwcm90ZWN0ZWQgZnR5cGUgPSAnYmFzZSc7XG4gIHByaXZhdGUgX2Jhc2VDaXJjID0gMDtcbiAgcHJpdmF0ZSBfX3VuaXZlcnNlOiBVbml2ZXJzZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuXG4gIEBTZXRBY2Nlc3NpYmxlKClcbiAgcHVibGljIHJlYWRvbmx5IGNoYW5uZWxzID0gbmV3IEFycmF5PENoYW5uZWxCYXNlPigpXG5cbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgY2hhbm5lbHM6IENoYW5uZWxCYXNlW10pIHtcbiAgICBjaGFubmVscy5tYXAoYz0+dGhpcy5hZGRDaGFubmVsKGMpKVxuICAgIGluaXRBY2Nlc3NpYmxlcyh0aGlzKVxuICB9XG5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVGcm9tT2JqKG9iOiBhbnkpOiBGaXh0dXJlQmFzZSB8dW5kZWZpbmVkIHtcbiAgICBpZiAob2IuY2hhbm5lbHMpIHtcbiAgICAgIGNvbnN0IGNzdHIgPSBmaXh0dXJlVHlwZXNbb2IuZnR5cGVdO1xuICAgICAgaWYgKGNzdHIpIHtcbiAgICAgICAgY29uc3QgaSA9IGNzdHIob2IubmFtZSwgW10pO1xuICAgICAgICBpLmNvbmZpZ3VyZUZyb21PYmoob2IpXG5cbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgY29uZmlndXJlRnJvbU9iaihvYjogYW55KXtcbiAgICBpZihvYi5iYXNlQ2lyYyl0aGlzLmJhc2VDaXJjID0gb2IuYmFzZUNpcmM7XG4gICAgaWYob2IuY2hhbm5lbHMpe1xuICAgICAgdGhpcy5jaGFubmVscy5tYXAoKGM6Q2hhbm5lbEJhc2UpID0+IHRoaXMucmVtb3ZlQ2hhbm5lbChjKSlcbiAgICAgIG9iLmNoYW5uZWxzLm1hcCgoYzogYW55KSA9PiB0aGlzLmFkZENoYW5uZWwoQ2hhbm5lbEJhc2UuY3JlYXRlRnJvbU9iaihjKSkpO1xuICAgIH1cbiAgfVxuXG4gIFxuXG5cbiAgcHVibGljIHNldCBiYXNlQ2lyYyhuOiBudW1iZXIpIHtcbiAgICB0aGlzLl9iYXNlQ2lyYyA9IG47XG4gICAgdGhpcy5jaGFubmVscy5tYXAoIChjKSA9PiBjLmNoZWNrRHVwbGljYXRlZENpcmMoKSk7XG4gIH1cbiAgcHVibGljIGdldCBiYXNlQ2lyYygpIHtyZXR1cm4gdGhpcy5fYmFzZUNpcmM7IH1cblxuXG4gIGdldCBpblN5bmMoKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY2hhbm5lbHMuZmlsdGVyKChjYykgPT4gY2MucmVhY3RUb01hc3RlcikpIHtcbiAgICAgIGlmICggYy5mbG9hdFZhbHVlICE9PSB0aGlzLmdsb2JhbFZhbHVlKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgdW5pdmVyc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191bml2ZXJzZTtcbiAgfVxuXG4gIHB1YmxpYyBzZXQgdW5pdmVyc2UodW5pOiBVbml2ZXJzZSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX191bml2ZXJzZSA9IHVuaTtcbiAgICB0aGlzLmNoYW5uZWxzLm1hcCggKGMpID0+IGMuc2V0UGFyZW50Rml4dHVyZSh0aGlzKSk7XG4gIH1cblxuXG5cbiAgXG4gIHB1YmxpYyBzZXROYW1lKG46IHN0cmluZykge1xuICAgIGNvbnN0IG9sZE5hbWUgPSB0aGlzLm5hbWVcbiAgICB0aGlzLm5hbWUgPSBuO1xuICAgIGlmKG9sZE5hbWUhPT1uKXtcbiAgICAgIHRoaXMuZXZlbnRzLmVtaXQoJ25hbWVDaGFuZ2VkJyx0aGlzLG9sZE5hbWUpXG4gICAgfVxuICAgIFxuICB9XG4gIHB1YmxpYyBidWlsZEFkZHJlc3MoKXtcbiAgICByZXR1cm4gXCIvbWFpblVuaXZlcnNlL1wiK3RoaXMubmFtZVxuICB9XG5cblxuICBARGlyZWN0UmVtb3RlRnVuY3Rpb24oKVxuICBwdWJsaWMgc2V0TWFzdGVyKHY6IENoYW5uZWxWYWx1ZVR5cGUpIHtcbiAgICB0aGlzLmdsb2JhbFZhbHVlID0gdjtcbiAgICB0aGlzLnN5bmNUb0dsb2JhbFZhbHVlKHYpO1xuICB9XG5cbiAgcHVibGljIHN5bmNUb0dsb2JhbFZhbHVlKHY6IENoYW5uZWxWYWx1ZVR5cGUpIHtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jaGFubmVscykge1xuICAgICAgaWYgKGMucmVhY3RUb01hc3Rlcikge1xuICAgICAgYy5zZXRWYWx1ZSh2LCB0cnVlKTtcbiAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFkZENoYW5uZWwoYzogQ2hhbm5lbEJhc2V8dW5kZWZpbmVkKSB7XG4gICAgaWYgKGMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYyA9IG5ldyBDaGFubmVsQmFzZSgnY2hhbm5lbCcsIDAsIDAsIHRydWUpO1xuICAgIH1cbiAgICBjLnNldFBhcmVudEZpeHR1cmUgKHRoaXMpO1xuICAgIHRoaXMuY2hhbm5lbHMucHVzaChjKTtcbiAgICByZXR1cm4gYztcbiAgfVxuICBwdWJsaWMgcmVtb3ZlQ2hhbm5lbChjOiBDaGFubmVsQmFzZSkge1xuICAgIGMuc2V0UGFyZW50Rml4dHVyZSAobnVsbCk7XG4gICAgY29uc3QgaSA9IHRoaXMuY2hhbm5lbHMuaW5kZXhPZihjKVxuICAgIGlmKGk+PTApdGhpcy5jaGFubmVscy5zcGxpY2UoaSwxKS8vID0gdGhpcy5jaGFubmVscy5maWx0ZXIoKHYpID0+IGMgIT09IHYpOyAvLyBkZWxldGU/XG4gIH1cblxuXG4gIHB1YmxpYyBnZXRDaGFubmVsRm9yTmFtZShuOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFubmVscy5maW5kKChjKSA9PiBjLm5hbWUgPT09IG4pO1xuICB9XG5cbiAgZ2V0IGNoYW5uZWxOYW1lcygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFubmVscy5tYXAoKGMpID0+IGMubmFtZSk7XG4gIH1cblxuXG5cbn1cblxuXG5leHBvcnQgY2xhc3MgRGlyZWN0Rml4dHVyZSBleHRlbmRzIEZpeHR1cmVCYXNlIHtcblxuICBjb25zdHJ1Y3RvciggY2hhbm5lbE5hbWU6IHN0cmluZywgIGNpcmNzOiBudW1iZXJbXSApIHtcbiAgICBzdXBlcihjaGFubmVsTmFtZSwgY2lyY3MubWFwKChjKSA9PiBuZXcgQ2hhbm5lbEJhc2UoJ2NoYW5uZWwnLCAwLCBjKSkpO1xuICAgIHRoaXMuZnR5cGUgPSAnZGlyZWN0JztcblxuICB9XG5cbn1cbmZpeHR1cmVUeXBlcy5kaXJlY3QgPSAoLi4uYXJnczogYW55W10pID0+IG5ldyBEaXJlY3RGaXh0dXJlKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuXG5cbmNvbnNvbGUubG9nKCdzdGFydGVkJylcbmNvbnN0IGYgPSBuZXcgRGlyZWN0Rml4dHVyZSgnbGFsYScsWzBdKVxuY29uc29sZS5sb2coXCJzZXROYW1lXCIpXG5mLnNldE5hbWUoXCJsYWxhXCIpXG4vLyBjb25zdCAgYWxsQ2lyY3MgID0gbmV3IEFycmF5KDUxMikuZmlsbCgwKS5tYXAoKF8sIGlkeCkgPT4gaWR4KTtcbi8vIGV4cG9ydCBjb25zdCBmaXh0dXJlQWxsID0gbmV3IERpcmVjdEZpeHR1cmUoJ2FsbCcsIGFsbENpcmNzKTtcblxuXG5cbiJdfQ==