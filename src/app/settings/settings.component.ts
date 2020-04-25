import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Config, ConfigService} from '../../service/config.service';
import {UtteranceTestService} from '../../service/utterance-test.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {ToastService} from '../../service/toast.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, AfterViewInit {


  @ViewChild('content')
  private content: TemplateRef<any>;

  modalRef: NgbModalRef;
  configModel: Config = null;
  nerdMode = false;
  firstUse = true;
  intentFetchObservable = new Subject<Event>();

  constructor(private modalService: NgbModal, private configService: ConfigService, private utteranceTestService: UtteranceTestService,
              private toastService: ToastService) {
  }

  ngOnInit(): void {
    window.addEventListener('drop', (x) => {
      this.toggleOverlay(false);
      this.loadConfigFromFile(x);
    });
    window.addEventListener('dragover', (x) => {
        x.preventDefault();
        this.toggleOverlay(true);
        return false;
      }
    );
    window.addEventListener('dragexit', (x) => {
        x.preventDefault();
        this.toggleOverlay(false);
        return false;
      }
    );
    this.firstUse = this.configService.isFirstUse();
    this.intentFetchObservable.pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(data => this.getIntents());
  }

  loadDemoConfig() {
    this.configService.loadConfig({
      version: 1,
      currentEnvironmentIndex: 0,
      environments: [
        {
          luisKey: '',
          luisURL: '',
          intents: ['DemoIntent1', 'DemoIntent2', 'DemoIntent3'],
          name: 'Demo Environment'
        }
      ]
    });
    this.modalRef.close(false);
  }

  toggleOverlay(show: boolean) {
    document.getElementById('fileDropOverlay').hidden = !show;
  }

  loadConfigFromFile(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          file.text().then((configText) => {
            this.configService.loadConfig(JSON.parse(configText));
            this.getIntents();
          }).catch(x => {
              this.toastService.error('Could not load configuration from file.');
            }
          );
        }
        // If dropped items aren't files, reject them
      }
    } else {
      this.toastService.error('Your browser is not supported yet.');
    }
  }


  ngAfterViewInit(): void {
    this.configService.getConfig().subscribe(config => {
      this.configModel = config;
      if (this.configModel.environments.length === 0) {
        if (!this.modalRef) {
          this.open();
        }
      }
    });
  }

  setNerdMode() {
    this.nerdMode = true;
  }

  addNewEnv() {
    this.configService.createEnvironment();
  }

  deleteEnv() {
    this.configService.deleteEnvironment();
  }

  closeInfoAlert() {
    this.configService.setFirstUse();
    this.firstUse = false;
  }

  open() {
    this.modalRef = this.modalService.open(this.content, {ariaLabelledBy: 'modal-basic-title', beforeDismiss: () => false, size: 'lg'});
    this.modalRef.result.then((shouldLoad) => {
      if (shouldLoad) {
        this.configService.loadConfig(this.configModel);
      }
    }).catch((e) => {
      console.error(e);
    });
  }

  reset() {
    this.configService.reset();
    this.firstUse = true;
  }

  modalDataChange(e) {
    this.intentFetchObservable.next(e);
  }

  getIntents() {
    if (this.configService.getCurrentEnvironment().luisURL && this.configService.getCurrentEnvironment().luisKey) {
      return this.utteranceTestService.fetchIntents();
    }
  }

  onFileChange(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsText(file);
      reader.onload = () => {
        this.configService.loadConfigFromString(String(reader.result));
        this.getIntents();
        this.modalRef.close(false);
      };
    }
  }

  exportConfiguration() {
    this.configService.exportConfig();
  }
}
