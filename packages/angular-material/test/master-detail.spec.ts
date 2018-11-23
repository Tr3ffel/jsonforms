/*
  The MIT License

  Copyright (c) 2018 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import {
  MatButtonModule,
  MatIconModule,
  MatListItem,
  MatListModule,
  MatSidenavModule
} from '@angular/material';
import { NgRedux } from '@angular-redux/store';
import { MockNgRedux } from '@angular-redux/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { JsonFormsOutlet, UnknownRenderer } from '@jsonforms/angular';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DebugElement } from '@angular/core';
import { MasterListComponent } from '../src/other/master-detail/master';
import { JsonFormsDetailComponent } from '../src/other/master-detail/detail';

describe('Master detail', () => {

  let fixture: ComponentFixture<MasterListComponent>;
  let component: any;

  const data = {
    orders: [
      {
        customer: {
          name: 'ACME'
        },
        title: 'Carrots'
      }
    ]
  };
  const schema = {
    definitions: {
      order: {
        type: 'object',
        properties: {
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          },
          title: {
            type: 'string'
          }
        }
      }
    },
    type: 'object',
    properties: {
      orders: {
        type: 'array',
        items: {
          $ref: '#/definitions/order'
        }
      }
    }
  };
  const uischema = {
    type: 'ListWithDetail',
    scope: '#/properties/orders',
    options: {
      labelRef: '#/items/properties/customer/properties/name',
      detail: {
        type: 'VerticalLayout',
        elements: [{
          type: 'Control',
          scope: '#/properties/customer/properties/name'
        }]
      }
    }
  };

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [
        JsonFormsOutlet,
        MasterListComponent,
        UnknownRenderer,
        JsonFormsDetailComponent
      ],
      imports: [
        MatListModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule,
        FlexLayoutModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: NgRedux, useFactory: MockNgRedux.getInstance },
      ],
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [UnknownRenderer]
      }
    }).compileComponents();

    MockNgRedux.reset();
    fixture = TestBed.createComponent(MasterListComponent);
    component = fixture.componentInstance;
  }));

  it('should render', async(() => {
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data,
          schema,
        }
      }
    });
    component.ngOnInit();
    mockSubStore.complete();

    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.masterItems.length).toBe(1);
      expect(fixture.debugElement.queryAll(By.directive(MatListItem)).length).toBe(1);
      // the component is wrapped in a div
      expect(fixture.nativeElement.children[0].style.display).not.toBe('none');
    });
  }));

  it('add a master item', async(() => {
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data,
          schema,
        }
      }
    });
    component.ngOnInit();
    mockSubStore.complete();
    fixture.detectChanges();

    const spy = spyOn(component, 'addItem').and.returnValue(() => { /* noop */ });
    fixture.whenStable().then(() => {
      const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
      buttons[1].nativeElement.click();
      fixture.detectChanges();
      fixture.whenRenderingDone().then(() => {
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
      });
    });
  }));

  it('remove an item', async(() => {
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data,
          schema,
        }
      }
    });
    component.ngOnInit();
    mockSubStore.complete();
    fixture.detectChanges();

    const spy = spyOn(component, 'removeItems').and.returnValue(() => { /* noop */ });
    fixture.whenStable().then(() => {
      const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
      });
    });
  }));

  it('remove an item with index < selected index', fakeAsync(() => {
    const moreData = {
      orders: [
        {
          customer: { name: 'Carrot Chipmunk' },
          title: 'Carrots'
        },
        {
          customer: { name: 'Banana Joe' },
          title: 'Bananas'
        },
        {
          customer: { name: 'Fry' },
          title: 'Slurm'
        }
      ]
    };
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data: moreData,
          schema,
        }
      }
    });
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    // select last element
    const listItems: DebugElement[] = fixture.debugElement.queryAll(By.directive(MatListItem));
    listItems[2].nativeElement.click();
    fixture.detectChanges();
    tick();

    // delete 1st item
    spyOn(component, 'deleteItem').and.callFake(() => {
      mockSubStore.next({
        jsonforms: {
          core: {
            data: { orders: moreData.orders.slice(1) },
            schema,
          }
        }
      });
      mockSubStore.complete();
      fixture.detectChanges();
      tick();
    });
    const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
    buttons[0].nativeElement.click();

    expect(component.selectedItemIdx).toBe(1);
    expect(component.selectedItem.data.title).toBe('Slurm');
  }));

  it('remove an item with index > selected index', fakeAsync(() => {
    const moreData = {
      orders: [
        {
          customer: { name: 'Carrot Chipmunk' },
          title: 'Carrots'
        },
        {
          customer: { name: 'Banana Joe' },
          title: 'Bananas'
        },
        {
          customer: { name: 'Fry' },
          title: 'Slurm'
        }
      ]
    };
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data: moreData,
          schema,
        }
      }
    });
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    // delete 2nd item
    spyOn(component, 'deleteItem').and.callFake(() => {
      const copy = moreData.orders.slice();
      copy.splice(1, 1);
      mockSubStore.next({
        jsonforms: {
          core: {
            data: { orders: copy },
            schema,
          }
        }
      });
      mockSubStore.complete();
      fixture.detectChanges();
      tick();
    });
    const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
    buttons[1].nativeElement.click();

    expect(component.selectedItemIdx).toBe(0);
    expect(component.selectedItem.data.title).toBe('Carrots');
  }));

  it('remove an item with index == selected index', fakeAsync(() => {
    const moreData = {
      orders: [
        {
          customer: { name: 'Carrot Chipmunk' },
          title: 'Carrots'
        },
        {
          customer: { name: 'Banana Joe' },
          title: 'Bananas'
        },
        {
          customer: { name: 'Fry' },
          title: 'Slurm'
        }
      ]
    };
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data: moreData,
          schema,
        }
      }
    });
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    // delete 1st item
    spyOn(component, 'deleteItem').and.callFake(() => {
      mockSubStore.next({
        jsonforms: {
          core: {
            data: { orders: moreData.orders.slice(1) },
            schema,
          }
        }
      });
      mockSubStore.complete();
      fixture.detectChanges();
      tick();
    });
    const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
    buttons[0].nativeElement.click();

    expect(component.selectedItemIdx).toBe(0);
    expect(component.selectedItem.data.title).toBe('Bananas');
  }));

  it('remove last item', fakeAsync(() => {
    const moreData = {
      orders: [
        {
          customer: { name: 'Carrot Chipmunk' },
          title: 'Carrots'
        }
      ]
    };
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data: moreData,
          schema,
        }
      }
    });
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    // delete item
    spyOn(component, 'deleteItem').and.callFake(() => {
      mockSubStore.next({
        jsonforms: {
          core: {
            data: { orders: [] },
            schema,
          }
        }
      });
      mockSubStore.complete();
      fixture.detectChanges();
      tick();
    });
    const buttons: DebugElement[] = fixture.debugElement.queryAll(By.css('button'));
    buttons[0].nativeElement.click();

    expect(component.selectedItemIdx).toBe(-1);
    expect(component.selectedItem).toBe(undefined);
  }));

  it('setting detail on click', async(() => {
    const mockSubStore = MockNgRedux.getSelectorStub();
    component.uischema = uischema;

    mockSubStore.next({
      jsonforms: {
        core: {
          data,
          schema,
        }
      }
    });
    component.ngOnInit();
    mockSubStore.complete();

    fixture.detectChanges();
    fixture.whenStable().then(() => {
      spyOn(component, 'onSelect');
      const select = fixture.debugElement.query(By.directive(MatListItem)).nativeElement;
      select.click();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(
          fixture.debugElement.queryAll(By.directive(JsonFormsDetailComponent)).length
        ).toBe(1);
        expect(component.onSelect)
          .toHaveBeenCalledWith(
            {
              label: 'ACME',
              data: {
                customer: { name: 'ACME' },
                title: 'Carrots'
              },
              path: 'orders.0',
              schema: undefined,
              uischema: {
                type: 'VerticalLayout',
                elements: [{
                  type: 'Control',
                  scope: '#/properties/customer/properties/name'
                }]
              }
            },
            0
          );
      });
    });
  }));

  it('can be hidden', async(() => {
    component.uischema = uischema;
    component.visible = false;
    const mockSubStore = MockNgRedux.getSelectorStub();
    mockSubStore.next({
      jsonforms: {
        core: {
          data,
          schema,
        }
      }
    });
    mockSubStore.complete();
    component.ngOnInit();
    fixture.detectChanges();
    fixture.whenRenderingDone().then(() => {
      expect(fixture.nativeElement.children[0].style.display).toBe('none');
    });
  }));
});
