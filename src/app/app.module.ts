import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {FormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NavbarComponent} from './navbar/navbar.component';
import {ToastComponent} from './toast/toast.component';
import {NgbAlertModule, NgbToastModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {LuisInterceptorService} from './interceptor/luis-interceptor.service';
import {AlertComponent} from './alert/alert.component';
import {TestBarComponent} from './test-bar/test-bar.component';
import {TestResultTableComponent} from './test-result-table/test-result-table.component';
import {SettingsComponent} from './settings/settings.component';
import {LoadTestsModalComponent} from './load-tests-modal/load-tests-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ToastComponent,
    AlertComponent,
    TestBarComponent,
    TestResultTableComponent,
    SettingsComponent,
    LoadTestsModalComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbToastModule,
    NgbAlertModule,
    NgbTooltipModule,
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: LuisInterceptorService,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule {
}
