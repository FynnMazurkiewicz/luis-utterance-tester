import {Component, OnInit} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Config, ConfigService} from '../../service/config.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  modalRef: NgbModalRef;
  configModel: Config = null;
  nerdMode = false;

  constructor(private modalService: NgbModal, private configService: ConfigService) {
    this.configService.getConfig().subscribe(config => {
      this.configModel = config;
    });
  }

  ngOnInit(): void {
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

  open(content) {
    this.modalRef = this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title', beforeDismiss: () => false});
    this.modalRef.result.then((shouldLoad) => {
      if (shouldLoad) {
        this.configService.loadConfig(this.configModel);
      }
    }).catch(() => {
    });
  }

  reset() {
    this.configService.reset();
  }

  updateIntents(e) {
    this.configModel.environments[this.configModel.currentEnvironmentIndex].intents = e.split(',');
  }

  onFileChange(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsText(file);
      reader.onload = () => {
        this.configService.loadConfigFromString(String(reader.result));
        this.modalRef.close(false);
      };
    }
  }

  exportConfiguration() {
    this.configService.exportConfig();
  }
}
