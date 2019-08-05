"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Fixture_1 = require("./Fixture");
var Channel_1 = require("./Channel");
var Utils_1 = require("./Utils");
var MemoryUtils_1 = require("./MemoryUtils");
var ServerSync_1 = require("./ServerSync");
var Universe = /** @class */ (function () {
    function Universe() {
        this.testedChannel = new Channel_1.ChannelBase('tested', 0, -1, false);
        this.driverName = 'none';
        this.fixtures = {};
        this._master = 1.0;
    }
    Object.defineProperty(Universe.prototype, "grandMaster", {
        get: function () { return this._master; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Universe.prototype, "fixtureList", {
        get: function () { return Object.values(this.fixtures); },
        enumerable: true,
        configurable: true
    });
    // singleton guard
    // public static createFromObj(ob: any): Universe {
    //   const uni = new Universe();
    //   uni.configureFromObj(ob)
    //   return uni;
    // }
    Universe.prototype.configureFromObj = function (ob) {
        var _this = this;
        if (ob.driverName) {
            this.setDriverName(ob.driverName);
        }
        if (ob.fixtures) {
            this.fixtureList.map(function (f) { return _this.removeFixture(f); });
            for (var f in Object.values(ob.fixtures)) {
                var df = Fixture_1.FixtureBase.createFromObj(f);
                if (df) {
                    this.addFixture(df);
                }
            }
        }
        else {
            console.error('parsing error', JSON.stringify(ob));
        }
    };
    Universe.prototype.setDriverName = function (n) {
        this.driverName = n;
    };
    Universe.prototype.setGrandMaster = function (n) {
        this._master = n;
        for (var _i = 0, _a = this.fixtureList; _i < _a.length; _i++) {
            var f = _a[_i];
            f.setMaster(this._master);
        }
    };
    Universe.prototype.addFixture = function (f) {
        var _this = this;
        f.name = Utils_1.getNextUniqueName(this.fixtureList.map(function (ff) { return ff.name; }), f.name);
        MemoryUtils_1.addProp(this.fixtures, f.name, f);
        f.events.on('nameChanged', function (ff, oldName) {
            var newName = Utils_1.getNextUniqueName(_this.fixtureList.filter(function (f) { return f !== ff; }).map(function (f) { return f.name; }), ff.name);
            MemoryUtils_1.deleteProp(_this.fixtures, oldName);
            ff.setName(newName);
            MemoryUtils_1.addProp(_this.fixtures, newName, ff);
        });
        f.universe = this;
    };
    Universe.prototype.removeFixture = function (f) {
        MemoryUtils_1.deleteProp(this.fixtures, f.name);
    };
    Universe.prototype.getNextCirc = function (d, forbidden) {
        var circsUsed = this.fixtureList.map(function (ff) { return ff.channels; }).flat().map(function (ch) { return ch.trueCirc; }).concat(forbidden || []);
        while (circsUsed.indexOf(d) !== -1) {
            d += 1;
        }
        return d;
    };
    Universe.prototype.checkCircsValidity = function () {
        var usedChannels = [];
        for (var _i = 0, _a = this.fixtureList; _i < _a.length; _i++) {
            var f = _a[_i];
            for (var _b = 0, _c = f.channels; _b < _c.length; _b++) {
                var c = _c[_b];
                c.hasDuplicatedCirc = usedChannels.indexOf(c.trueCirc) !== -1;
                if (!c.hasDuplicatedCirc) {
                    usedChannels.push(c.trueCirc);
                }
            }
        }
    };
    Object.defineProperty(Universe.prototype, "allChannels", {
        get: function () {
            return this.fixtureList.map(function (f) { return f.channels; }).flat();
        },
        enumerable: true,
        configurable: true
    });
    Universe.prototype.testDimmerNum = function (d) {
        if (this.testedChannel.circ >= 0) {
            this.testedChannel.setValue(0.0, true);
        }
        this.setTestedChannelDimmer(d);
        if (this.testedChannel.circ >= 0) {
            this.testedChannel.setValue(1.0, true);
        }
    };
    Universe.prototype.setTestedChannelDimmer = function (dimmerNum) {
        this.testedChannel.circ = dimmerNum;
    };
    __decorate([
        ServerSync_1.SetAccessible()
    ], Universe.prototype, "fixtures", void 0);
    return Universe;
}());
exports.Universe = Universe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVW5pdmVyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9Vbml2ZXJzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLHFDQUF3QztBQUN4QyxxQ0FBd0M7QUFDeEMsaUNBQTRDO0FBQzVDLDZDQUFtRDtBQUNuRCwyQ0FBNEM7QUFDNUM7SUFPRTtRQUxnQixrQkFBYSxHQUFHLElBQUkscUJBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLGVBQVUsR0FBRyxNQUFNLENBQUM7UUFFWCxhQUFRLEdBQStCLEVBQUUsQ0FBQztRQUNsRCxZQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ1AsQ0FBQztJQUVoQixzQkFBVyxpQ0FBVzthQUF0QixjQUEwQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNoRCxzQkFBVyxpQ0FBVzthQUF0QixjQUF5QixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUEsQ0FBQzs7O09BQUE7SUFDaEUsa0JBQWtCO0lBQ2hCLG1EQUFtRDtJQUNuRCxnQ0FBZ0M7SUFDaEMsNkJBQTZCO0lBQzdCLGdCQUFnQjtJQUVoQixJQUFJO0lBQ0csbUNBQWdCLEdBQXZCLFVBQXdCLEVBQU87UUFBL0IsaUJBaUJDO1FBaEJDLElBQUcsRUFBRSxDQUFDLFVBQVUsRUFBQztZQUNmLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQ2xDO1FBQ0QsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO1lBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUcsT0FBQSxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFyQixDQUFxQixDQUFDLENBQUE7WUFDaEQsS0FBSyxJQUFNLENBQUMsSUFBSSxNQUFNLENB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QztJQUNILENBQUM7SUFFTSx5Q0FBc0IsR0FBN0IsVUFBOEIsU0FBaUI7UUFDN0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO0lBQ3RDLENBQUM7SUEzRkQ7UUFEQywwQkFBYSxFQUFFOzhDQUMwQztJQThGNUQsZUFBQztDQUFBLEFBbkdELElBbUdDO0FBbkdZLDRCQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRml4dHVyZUJhc2UgfSBmcm9tICcuL0ZpeHR1cmUnO1xuaW1wb3J0IHsgQ2hhbm5lbEJhc2UgfSBmcm9tICcuL0NoYW5uZWwnO1xuaW1wb3J0IHsgZ2V0TmV4dFVuaXF1ZU5hbWUgfSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IGFkZFByb3AsIGRlbGV0ZVByb3AgfSBmcm9tICcuL01lbW9yeVV0aWxzJ1xuaW1wb3J0IHsgU2V0QWNjZXNzaWJsZSB9IGZyb20gXCIuL1NlcnZlclN5bmNcIlxuZXhwb3J0IGNsYXNzIFVuaXZlcnNlIHtcblxuICBwdWJsaWMgcmVhZG9ubHkgdGVzdGVkQ2hhbm5lbCA9IG5ldyBDaGFubmVsQmFzZSgndGVzdGVkJywgMCwgLTEsIGZhbHNlKTtcbiAgcHVibGljIGRyaXZlck5hbWUgPSAnbm9uZSc7XG4gIEBTZXRBY2Nlc3NpYmxlKClcbiAgcHVibGljIHJlYWRvbmx5IGZpeHR1cmVzIDp7W2lkOnN0cmluZ106IEZpeHR1cmVCYXNlfSA9IHt9O1xuICBwcml2YXRlIF9tYXN0ZXIgPSAxLjA7XG4gIGNvbnN0cnVjdG9yKCkge31cblxuICBwdWJsaWMgZ2V0IGdyYW5kTWFzdGVyKCkge3JldHVybiB0aGlzLl9tYXN0ZXI7IH1cbiAgcHVibGljIGdldCBmaXh0dXJlTGlzdCgpe3JldHVybiBPYmplY3QudmFsdWVzKHRoaXMuZml4dHVyZXMpO31cbi8vIHNpbmdsZXRvbiBndWFyZFxuICAvLyBwdWJsaWMgc3RhdGljIGNyZWF0ZUZyb21PYmoob2I6IGFueSk6IFVuaXZlcnNlIHtcbiAgLy8gICBjb25zdCB1bmkgPSBuZXcgVW5pdmVyc2UoKTtcbiAgLy8gICB1bmkuY29uZmlndXJlRnJvbU9iaihvYilcbiAgLy8gICByZXR1cm4gdW5pO1xuXG4gIC8vIH1cbiAgcHVibGljIGNvbmZpZ3VyZUZyb21PYmoob2I6IGFueSkge1xuICAgIGlmKG9iLmRyaXZlck5hbWUpe1xuICAgICAgdGhpcy5zZXREcml2ZXJOYW1lKG9iLmRyaXZlck5hbWUpXG4gICAgfVxuICAgIGlmIChvYi5maXh0dXJlcykge1xuICAgICAgdGhpcy5maXh0dXJlTGlzdC5tYXAoKGYpPT50aGlzLnJlbW92ZUZpeHR1cmUoZikpXG4gICAgICBmb3IgKGNvbnN0IGYgaW4gT2JqZWN0LnZhbHVlcyhvYi5maXh0dXJlcykgKXtcbiAgICAgICAgY29uc3QgZGYgPSBGaXh0dXJlQmFzZS5jcmVhdGVGcm9tT2JqKGYpO1xuICAgICAgICBpZiAoZGYpIHtcbiAgICAgICAgICB0aGlzLmFkZEZpeHR1cmUoZGYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ3BhcnNpbmcgZXJyb3InLEpTT04uc3RyaW5naWZ5KG9iKSk7XG4gICAgfVxuICAgIFxuXG4gIH1cblxuICBwdWJsaWMgc2V0RHJpdmVyTmFtZShuOnN0cmluZyl7XG4gICAgdGhpcy5kcml2ZXJOYW1lICA9IG5cbiAgfVxuICBwdWJsaWMgc2V0R3JhbmRNYXN0ZXIobjogbnVtYmVyKSB7XG4gICAgdGhpcy5fbWFzdGVyID0gbjtcbiAgICBmb3IgKCBjb25zdCBmIG9mIHRoaXMuZml4dHVyZUxpc3QpIHtcbiAgICAgIGYuc2V0TWFzdGVyKHRoaXMuX21hc3Rlcik7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFkZEZpeHR1cmUoZjogRml4dHVyZUJhc2UpIHtcbiAgICBmLm5hbWUgPSBnZXROZXh0VW5pcXVlTmFtZSh0aGlzLmZpeHR1cmVMaXN0Lm1hcCgoZmYpID0+IGZmLm5hbWUpLCBmLm5hbWUpO1xuICAgIGFkZFByb3AodGhpcy5maXh0dXJlcyxmLm5hbWUsZik7XG4gICAgZi5ldmVudHMub24oJ25hbWVDaGFuZ2VkJywoZmY6Rml4dHVyZUJhc2Usb2xkTmFtZTpzdHJpbmcpPT57XG4gICAgICBjb25zdCBuZXdOYW1lID0gZ2V0TmV4dFVuaXF1ZU5hbWUodGhpcy5maXh0dXJlTGlzdC5maWx0ZXIoKGYpID0+IGYgIT09IGZmKS5tYXAoKGYpID0+IGYubmFtZSksIGZmLm5hbWUpO1xuICAgICAgZGVsZXRlUHJvcCh0aGlzLmZpeHR1cmVzLG9sZE5hbWUpXG4gICAgICBmZi5zZXROYW1lKG5ld05hbWUpXG4gICAgICBhZGRQcm9wKHRoaXMuZml4dHVyZXMsbmV3TmFtZSxmZilcbiAgICB9KVxuICAgIGYudW5pdmVyc2UgPSB0aGlzO1xuICB9XG4gIHB1YmxpYyByZW1vdmVGaXh0dXJlKGY6IEZpeHR1cmVCYXNlKSB7XG4gICAgZGVsZXRlUHJvcCh0aGlzLmZpeHR1cmVzLGYubmFtZSk7XG4gIH1cbiAgcHVibGljIGdldE5leHRDaXJjKGQ6IG51bWJlciwgZm9yYmlkZGVuPzogbnVtYmVyW10pOiBudW1iZXIge1xuICAgIGNvbnN0IGNpcmNzVXNlZCA9IHRoaXMuZml4dHVyZUxpc3QubWFwKChmZikgPT4gZmYuY2hhbm5lbHMpLmZsYXQoKS5tYXAoKGNoKSA9PiBjaC50cnVlQ2lyYykuY29uY2F0KGZvcmJpZGRlbiB8fCBbXSk7XG4gICAgd2hpbGUgKGNpcmNzVXNlZC5pbmRleE9mKGQpICE9PSAtMSkge2QgKz0gMTsgfVxuICAgIHJldHVybiBkO1xuICB9XG5cbiAgcHVibGljIGNoZWNrQ2lyY3NWYWxpZGl0eSgpIHtcbiAgICBjb25zdCB1c2VkQ2hhbm5lbHMgPSBbXTtcbiAgICBmb3IgKCBjb25zdCBmIG9mIHRoaXMuZml4dHVyZUxpc3QpIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiBmLmNoYW5uZWxzKSB7XG4gICAgICAgIGMuaGFzRHVwbGljYXRlZENpcmMgPSB1c2VkQ2hhbm5lbHMuaW5kZXhPZihjLnRydWVDaXJjKSAhPT0gLTE7XG4gICAgICAgIGlmICghYy5oYXNEdXBsaWNhdGVkQ2lyYykge1xuICAgICAgICAgIHVzZWRDaGFubmVscy5wdXNoKGMudHJ1ZUNpcmMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXQgYWxsQ2hhbm5lbHMoKXtcbiAgICByZXR1cm4gdGhpcy5maXh0dXJlTGlzdC5tYXAoZj0+Zi5jaGFubmVscykuZmxhdCgpXG4gIH1cblxuXG4gIHB1YmxpYyB0ZXN0RGltbWVyTnVtKGQ6bnVtYmVyKXtcbiAgICBpZiAodGhpcy50ZXN0ZWRDaGFubmVsLmNpcmMgPj0gMCkge1xuICAgICAgdGhpcy50ZXN0ZWRDaGFubmVsLnNldFZhbHVlKCAwLjAsdHJ1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRUZXN0ZWRDaGFubmVsRGltbWVyKGQpO1xuICAgIGlmICh0aGlzLnRlc3RlZENoYW5uZWwuY2lyYyA+PSAwKSB7XG4gICAgICB0aGlzLnRlc3RlZENoYW5uZWwuc2V0VmFsdWUoIDEuMCx0cnVlKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2V0VGVzdGVkQ2hhbm5lbERpbW1lcihkaW1tZXJOdW06IG51bWJlciApIHtcbiAgICB0aGlzLnRlc3RlZENoYW5uZWwuY2lyYyA9IGRpbW1lck51bTtcbiAgfVxuXG5cbn1cblxuIl19