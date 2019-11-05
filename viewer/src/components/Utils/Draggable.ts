import { Point, Rect, Size } from '@API/Utils2D';
export class Draggable {
  public hovered = false;
  public selected = false;
  public clicked = false;
  public location = new Point(0, 0);
  public order = 0;
  public isDraggable = true;
  public isSelectable = true;
  constructor(public jsObj: any) {
    // debugger
  }
  public isOver(p: Point) {return false; }// to override


}

type Constructor<T> = new (...args: any[]) => T;
function typeGuard<T>(o: any, className: Constructor<T>): o is T {
  return o instanceof className;
}

export class DraggableHandler {
get hovered() {
  return this.hoveredDraggable;
}
get clicked() {
  return this.clickedDraggable;
}
get hasDragged() {return this._hasDragged; }
private hoveredDraggable: Draggable | null = null;
private selectedDraggable: Draggable | null = null;
private clickedDraggable: Draggable | null = null;
private oldClickedDraggable: Draggable | null = null;
private _hasDragged = false;
  constructor() {}
  public mouseDown(p: Point, e: MouseEvent) {
    this._hasDragged = false;
    const dr = this.findDraggableForPoint(p);
    if (dr !== this.clickedDraggable) {
      if (this.clickedDraggable) {this.clickedDraggable.clicked = false; }
      this.clickedDraggable = dr;
      if (this.clickedDraggable) {this.clickedDraggable.clicked = true; }
    }
  }
  public mouseMove(p: Point, e: MouseEvent) {
    this._hasDragged = this._hasDragged || (e.movementX !== 0 || e.movementY !== 0);
    if (this.clickedDraggable === null) {
      const dr = this.findDraggableForPoint(p);
      if (dr !== this.hoveredDraggable) {
        if (this.hoveredDraggable) {this.hoveredDraggable.hovered = false; }
        this.hoveredDraggable = dr;
        if (this.hoveredDraggable) {this.hoveredDraggable.hovered = true; }
      }
    } else if (this.clickedDraggable.isDraggable) {
      this.clickedDraggable.location = p;
    }
  }
  public mouseUp(p: Point, e: MouseEvent) {
    if (this.clickedDraggable && this.clickedDraggable.isSelectable) {
      if (this.selectedDraggable ) {this.selectedDraggable.selected = false; }
      this.selectedDraggable = this.clickedDraggable;
      if (this.selectedDraggable ) {this.selectedDraggable.selected = true; }
    }
    if (this.clickedDraggable !== null) {
    this.clickedDraggable = null;
  }

}
public mouseLeave(e: MouseEvent) {
  if (e.buttons === 1) {
  this.oldClickedDraggable = this.clickedDraggable;
  this.clickedDraggable = null;
}
}
public mouseEnter(e: MouseEvent) {
  if (this.oldClickedDraggable && e.buttons === 1) {
    this.clickedDraggable = this.oldClickedDraggable;
    this.oldClickedDraggable = null;
  }

}
public findDraggableForPoint(p: Point) {
  let dr: Draggable | null = null;
  const allDrag = this.getAllDraggables();

  for (const d of allDrag ) {
    if (d.isOver(p) && (!dr || d.order >= dr.order)) {
      dr = d;
    }
  }
  return dr;
}

public getHoveredObjAs<T>(c: Constructor<T>): T|null {
  if (this.hoveredDraggable && typeGuard<T>(this.hoveredDraggable.jsObj, c)) {
    return this.hoveredDraggable.jsObj as T;
  }
  return null;
}
public getSelectedObjAs<T >(c: Constructor<T>): T|null {
  if (this.selectedDraggable && typeGuard<T>(this.selectedDraggable.jsObj, c)) {
    return this.selectedDraggable.jsObj as T;
  }
  return null;
}
// add(d:Draggable){this.draggables.push(d);}
// remove(d:Draggable){const i = this.draggables.indexOf(d);if(i>=0){this.draggables.splice(i,1)};}

public getAllDraggables() {return new Array<Draggable>(); }
}

