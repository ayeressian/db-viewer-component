import constant from "./const";
import { center, distance } from "./math-util";
import Minimap from "./minimap";
import Table from "./table";
import Callbacks from "./types/callbacks";
import CommonEventListener from "./types/common-event-listener";
import ViewBoxVals from "./types/view-box-vals";
import { isSafari } from "./util";
import Viewer from "./viewer";

interface GestureEvent extends MouseEvent {
  scale: number;
}

class ViewerEvents {
  private disbleScrollEvent = false;
  private zoomResolve?: () => void;
  private gestureStart = false;
  private safariScale!: number;
  private panXResolver?: () => void;
  private panYResolver?: () => void;

  constructor(
    private svgContainer: HTMLElement,
    private viewBoxVals: ViewBoxVals,
    private viewer: Viewer,
    private minimap: Minimap,
    private svgElem: SVGGraphicsElement,
    private mainElem: ShadowRoot,
    private container: HTMLElement,
    private tables: Table[],
    private callbacks: Callbacks,
    private setZoom: (
      zoom: number,
      targetX: number,
      targetY: number
    ) => Promise<void>,
    private onTableMove: (
      table: Table,
      deltaX: number,
      deltaY: number,
      cordinatesChanged: boolean
    ) => void
  ) {
    this.setUpEvents();
  }

  setPanXResolver(panXResolver: () => void): void {
    this.panXResolver = panXResolver;
  }

  setPanYResolver(panYResolver: () => void): void {
    this.panYResolver = panYResolver;
  }

  setZoomResolver(zoomResolve: () => void): void {
    this.zoomResolve = zoomResolve;
  }

  getGestureStart(): boolean {
    return this.gestureStart;
  }

  private static noneTableAndMinmapEvent(event: Event): boolean {
    return !event.composedPath().some((item) => {
      const htmlElement = item as HTMLElement;
      return (
        htmlElement.id === "minimap-container" ||
        htmlElement.classList?.contains("table")
      );
    });
  }

  private onScroll = () => {
    if (!this.disbleScrollEvent) {
      const zoom = this.viewer.getZoom();
      this.viewBoxVals.x = this.svgContainer.scrollLeft / zoom;
      this.viewBoxVals.y = this.svgContainer.scrollTop / zoom;
      this.minimap.setMinimapViewPoint(this.viewBoxVals);
      if (this.panXResolver) {
        this.panXResolver();
        delete this.panXResolver;
      }
      if (this.panYResolver) {
        this.panYResolver();
        delete this.panYResolver;
      }
    }
    if (this.zoomResolve) {
      this.zoomResolve();
      delete this.zoomResolve;
    }
    this.disbleScrollEvent = false;
  };

  private onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      const clientRect = this.svgContainer.getBoundingClientRect();
      const targetX = event.clientX - clientRect.left;
      const targetY = event.clientY - clientRect.top;
      this.setZoom(
        this.viewer.getZoom() -
          event.deltaY * constant.SCROLL_TO_ZOOM_MULTIPLIER,
        targetX,
        targetY
      );
      event.preventDefault();
    }
  };

  private onTouchMove = (event: Event) => {
    // Don't move viewport when table is being moved
    if (!ViewerEvents.noneTableAndMinmapEvent(event)) event.preventDefault();
  };

  private onGesturestart = (event: GestureEvent) => {
    this.gestureStart = true;
    if (event.scale != null) {
      this.safariScale = event.scale;
    }
    event.preventDefault();
  };

  private onGesturechange = (event: GestureEvent) => {
    event.preventDefault();
    const clientRect = this.svgContainer.getBoundingClientRect();
    const targetX = event.clientX - clientRect.left;
    const targetY = event.clientY - clientRect.top;
    const scaleChange = event.scale - this.safariScale;
    this.setZoom(this.viewer.getZoom() + scaleChange, targetX, targetY);
    this.safariScale = event.scale;
  };

  private onGestureend = () => {
    this.gestureStart = false;
  };

  private prevMouseCordX!: number;
  private prevMouseCordY!: number;

  private onMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    if (ViewerEvents.noneTableAndMinmapEvent(event)) {
      const deltaX = event.clientX - this.prevMouseCordX;
      const deltaY = event.clientY - this.prevMouseCordY;
      this.prevMouseCordY = event.clientY;
      this.prevMouseCordX = event.clientX;
      const originalScrollLeft = this.svgContainer.scrollLeft;
      this.svgContainer.scrollLeft -= deltaX;
      if (originalScrollLeft !== this.svgContainer.scrollLeft) {
        this.viewBoxVals.x -= deltaX;
      }
      const originalScrollTop = this.svgContainer.scrollTop;
      this.svgContainer.scrollTop -= deltaY;
      if (originalScrollTop !== this.svgContainer.scrollTop) {
        this.viewBoxVals.y -= deltaY;
      }
      this.minimap.setMinimapViewPoint(this.viewBoxVals);
    }
  };

  private onMousedown = (event: MouseEvent) => {
    if (event.button === 0 && ViewerEvents.noneTableAndMinmapEvent(event)) {
      this.svgElem.classList.add("pan");
      this.prevMouseCordX = event.clientX;
      this.prevMouseCordY = event.clientY;
      this.mainElem.addEventListener(
        "mousemove",
        this.onMouseMove as CommonEventListener
      );
    }
  };

  private onMouseup = () => {
    this.svgElem.classList.remove("pan");
    this.mainElem.removeEventListener(
      "mousemove",
      this.onMouseMove as CommonEventListener
    );
  };

  private evCache: PointerEvent[] = [];
  private prevDiff?: number;

  private onPointerdown = (event: PointerEvent) => {
    this.evCache.push(event);
  };

  private onPointermove = (event: PointerEvent) => {
    const index = this.evCache.findIndex(
      (item) => item.pointerId === event.pointerId
    );
    if (index !== -1) {
      this.evCache[index] = event;
    }
    if (this.evCache.length == 2) {
      this.gestureStart = true;
      // Calculate the distance between the two pointers
      const p1 = { x: this.evCache[0].clientX, y: this.evCache[0].clientY };
      const p2 = { x: this.evCache[1].clientX, y: this.evCache[1].clientY };
      const centerPoint = center(p1, p2);
      const curDiff = distance(p1, p2);
      if (this.prevDiff != null) {
        const delta = curDiff - this.prevDiff;
        event.preventDefault();
        this.setZoom(
          this.viewer.getZoom() + delta * constant.PINCH_TO_ZOOM_MULTIPLIER,
          centerPoint.x,
          centerPoint.y
        );
      }
      this.prevDiff = curDiff;
    }
  };

  private onPointer = (event: PointerEvent) => {
    // Remove this pointer from the cache and reset the target's
    // background and border
    const index = this.evCache.findIndex(
      (item) => item.pointerId === event.pointerId
    );
    if (index !== -1) this.evCache.splice(index, 1);

    // If the number of pointers down is less than two then reset diff tracker
    if (this.evCache.length < 2) {
      this.prevDiff = undefined;
      this.gestureStart = false;
    }
  };

  private onClick = (event: MouseEvent) => {
    const zoom = this.viewer.getZoom();
    const x = event.offsetX / zoom;
    const y = event.offsetY / zoom;
    this.callbacks?.viewportClick(x, y);
  };

  private windowResizeEvent(): void {
    const zoom = this.viewer.getZoom();
    this.viewBoxVals.width = this.svgContainer.clientWidth / zoom;
    this.viewBoxVals.height = this.svgContainer.clientHeight / zoom;

    this.viewer.viewportAddjustment();

    this.minimap.setMinimapViewPoint(this.viewBoxVals);
  }

  setUpEvents(): void {
    window.addEventListener("resize", this.windowResizeEvent.bind(this));

    this.mainElem.addEventListener("touchmove", this.onTouchMove);

    this.container.addEventListener("mouseleave", () => {
      this.svgElem.classList.remove("pan");
      this.mainElem.removeEventListener(
        "mousemove",
        this.onMouseMove as CommonEventListener
      );
    });

    this.container.addEventListener("mousedown", this.onMousedown);

    this.mainElem.addEventListener("mouseup", this.onMouseup);

    this.container.addEventListener(
      "mouseleave",
      this.minimap.onContainerMouseLeave!
    );
    this.container.addEventListener(
      "mouseup",
      this.minimap.onContainerMouseUp!
    );

    if (this.tables) {
      this.tables.forEach((table) => {
        table.setMoveListener(this.onTableMove);
      });
    }

    this.svgContainer.addEventListener("scroll", this.onScroll);

    this.svgContainer.addEventListener("click", this.onClick);

    this.container.addEventListener("wheel", this.onWheel);

    if (isSafari) {
      this.container.addEventListener(
        "gesturestart",
        this.onGesturestart as CommonEventListener
      );
      this.container.addEventListener(
        "gesturechange",
        this.onGesturechange as CommonEventListener,
        true
      );

      this.container.addEventListener("gestureend", this.onGestureend);
    } else {
      this.container.addEventListener("pointerdown", this.onPointerdown);
      this.container.addEventListener("pointermove", this.onPointermove);

      this.container.addEventListener("pointerup", this.onPointer, true);
      this.container.addEventListener("pointercancel", this.onPointer, true);
      this.container.addEventListener("pointerout", this.onPointer, true);
      this.container.addEventListener("pointerleave", this.onPointer, true);
    }
  }

  // TODO: call cleanup when appropriate
  cleanup(): void {
    this.minimap.cleanup();

    this.mainElem.removeEventListener(
      "mousemove",
      this.onMouseMove as CommonEventListener
    );

    window.removeEventListener("resize", this.windowResizeEvent.bind(this));
    this.mainElem.removeEventListener("touchmove", this.onTouchMove);
    this.container.removeEventListener("mousedown", this.onMousedown);
    this.mainElem.removeEventListener("mouseup", this.onMouseup);
    this.container.removeEventListener(
      "mouseleave",
      this.minimap.onContainerMouseLeave!
    );
    this.container.removeEventListener(
      "mouseup",
      this.minimap.onContainerMouseUp!
    );

    this.tables.forEach((table) => {
      table.cleanup();
    });

    this.svgContainer.removeEventListener("scroll", this.onScroll);
    this.svgContainer.removeEventListener("click", this.onClick);
    this.container.removeEventListener("wheel", this.onWheel);

    if (isSafari) {
      this.container.removeEventListener(
        "gesturestart",
        this.onGesturestart as CommonEventListener
      );
      this.container.removeEventListener(
        "gesturechange",
        this.onGesturechange as CommonEventListener,
        true
      );

      this.container.removeEventListener("gestureend", this.onGestureend);
    } else {
      this.container.removeEventListener("pointerdown", this.onPointerdown);
      this.container.removeEventListener("pointermove", this.onPointermove);

      this.container.removeEventListener("pointerup", this.onPointer, true);
      this.container.removeEventListener("pointercancel", this.onPointer, true);
      this.container.removeEventListener("pointerout", this.onPointer, true);
      this.container.removeEventListener("pointerleave", this.onPointer, true);
    }
  }
}

export default ViewerEvents;
