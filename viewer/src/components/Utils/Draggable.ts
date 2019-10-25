import { Point, Rect, Size } from '@API/Utils2D';
export class Draggable{
  constructor(public jsObj:any){
    // debugger
  }
  public hovered=false;
  public selected=false;
  public clicked = false
  public location = new Point(0,0);
  public order = 0;
  public isDraggable = true
  public isSelectable = true
  public isOver(p:Point){return false}//to override
  

}

type Constructor<T> = { new (...args: any[]): T };
function typeGuard<T>(o:any, className: Constructor<T>): o is T {
  return o instanceof className;
}

export class DraggableHandler{
  constructor(){}
  mouseDown(p:Point,e:MouseEvent){
    this._hasDragged= false
    const dr = this.findDraggableForPoint(p)
    if(dr!=this.clickedDraggable){
      if(this.clickedDraggable){this.clickedDraggable.clicked=false;}
      this.clickedDraggable = dr;
      if(this.clickedDraggable){this.clickedDraggable.clicked=true;}
    }
  }
  mouseMove(p:Point,e:MouseEvent){
    this._hasDragged= this._hasDragged || (e.movementX!==0 || e.movementY!==0)
    if(this.clickedDraggable===null){
      const dr = this.findDraggableForPoint(p);
      if(dr!==this.hoveredDraggable){
        if(this.hoveredDraggable){this.hoveredDraggable.hovered=false;}
        this.hoveredDraggable = dr;
        if(this.hoveredDraggable){this.hoveredDraggable.hovered=true;}
      }
    }
    else if(this.clickedDraggable.isDraggable){
      this.clickedDraggable.location=p;
    }
  }
  mouseUp(p:Point,e:MouseEvent){
    if(this.clickedDraggable && this.clickedDraggable.isSelectable){
      if(this.selectedDraggable ){this.selectedDraggable.selected=false}
        this.selectedDraggable = this.clickedDraggable
      if(this.selectedDraggable ){this.selectedDraggable.selected=true}
    }
  if(this.clickedDraggable!==undefined){
    this.clickedDraggable = null;
  }

}

findDraggableForPoint(p:Point){
  let dr :Draggable | null = null
  const allDrag = this.getAllDraggables()

  for(const d of allDrag ){
    if(d.isOver(p) && (!dr || d.order>=dr.order)){
      dr = d;
    }
  }
  return dr;
}
get hovered(){
  return this.hoveredDraggable
}
get clicked(){
  return this.clickedDraggable
}

getHoveredObjAs<T>(c:Constructor<T>):T|null{
  if(this.hoveredDraggable && typeGuard<T>(this.hoveredDraggable.jsObj,c)){
    return this.hoveredDraggable.jsObj as T
  }
  return null
}
getSelectedObjAs<T >(c:Constructor<T>):T|null{
  if(this.selectedDraggable && typeGuard<T>(this.selectedDraggable.jsObj,c)){
    return this.selectedDraggable.jsObj as T
  }
  return null
}
// add(d:Draggable){this.draggables.push(d);}
// remove(d:Draggable){const i = this.draggables.indexOf(d);if(i>=0){this.draggables.splice(i,1)};}

public getAllDraggables(){return new Array<Draggable>();}
private hoveredDraggable :Draggable | null = null
private selectedDraggable :Draggable | null = null
private clickedDraggable :Draggable | null = null
get hasDragged(){return this._hasDragged;}
private _hasDragged = false
}

