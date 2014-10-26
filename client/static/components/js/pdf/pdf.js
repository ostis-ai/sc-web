PdfComponent = {
    formats: ['format_pdf'],
    factory: function(sandbox) {
        return new PdfViewer(sandbox);
    }
};


var PdfViewer = function(sandbox) {
    
    function Viewer () {
        var self = this;

        self.pageCount = 0;
        self.pageNum = 1;
        self.pdfDoc = null;
        self.pageRendering = false;
        self.pageNumPending = null;
        self.scale = 1.0;
        self.canvas = null;
        self.ctx = null;
        self.id = 0;

        self.viewPdf = function (url, id) {
            self.id = id;
            self.canvas = document.getElementById('pdf_canvas'  + self.id);
            self.ctx = self.canvas.getContext('2d');

            PDFJS.disableWorker = true;
            PDFJS.getDocument(url).then(function (pdfDoc_) {
                self.pdfDoc = pdfDoc_;

                document.getElementById('pdf_page_count' + self.id).textContent = self.pdfDoc.numPages;
                self.pageCount = self.pdfDoc.numPages;

                self.renderPage(self.pageNum);
           });
        };

        self.renderPage = function(num) {
            self.pageRendering = true;

            self.pdfDoc.getPage(num).then(function(page) {

                var viewport = page.getViewport(self.scale);
                self.canvas.height = viewport.height;
                self.canvas.width = viewport.width;

                var renderContext = {
                    canvasContext: self.ctx,
                    viewport: viewport
                };

                var renderTask = page.render(renderContext);

                renderTask.promise.then(function () {
                    self.pageRendering = false;

                    if (self.pageNumPending !== null) {
                        self.renderPage(pageNumPending);
                        self.pageNumPending = null;
                    }
                });
            });
            document.getElementById('pdf_page_number'  + self.id).textContent = self.pageNum;
       };

       self.queueRenderPage = function (num) {
           if (self.pageRendering) {
               self.pageNumPending = num;
           } else {
               self.renderPage(num);
           }
       };

       self.nextPage = function() {
           if (self.pageNum >= self.pdfDoc.numPages) {
               return;
           }
           self.pageNum++;
           self.queueRenderPage(self.pageNum);   
      };

      self.prevPage = function() {
           if (self.pageNum <= 1) {
               return;
           }
           self.pageNum--;
           self.queueRenderPage(self.pageNum);   
      };

      self.goToPage = function() {
          var pageNo = document.getElementById('pdf_go_to_page' + self.id).value;	  
          pageNo = +pageNo;

          if (!!pageNo === false || pageNo < 1 || pageNo > self.pageCount) {
            $('#pdf_go_to_page' + self.id).val(1);
            self.pageNum = 1;
            self.renderPage(1);
            return;
          }

          self.pageNum = pageNo;
          self.queueRenderPage(self.pageNum);
      };

    }
    
	var self = this;
	
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    // ---- window interface -----
    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).empty();
        
        var uniqId = Math.floor(Math.random() * (100000 - 0) + 0);  
        var viewer = new Viewer();
	
        self.createHtml(uniqId, this.container);
        
        $('#pdf_next_page' + uniqId).click(function(){
           viewer.nextPage();
        });
        
        $('#pdf_prev_page' + uniqId).click(function(){
            viewer.prevPage();
        });
        
        $('#pdf_go_to_page_button' + uniqId).click(function(){
            viewer.goToPage();
        });
        
        $('#pdf_canvas' + uniqId).click(function(){
            window.open(location.origin + "/" + data);
        });
        
        viewer.viewPdf(data, uniqId);
        
        dfd.resolve();
        return dfd.promise();
    };
    
        
    this.createHtml = function(id, container){	
       var mainPdfDiv = '<div id="pdf' + id + '"></div>';
       $(container).append(mainPdfDiv);
       
       var controlsDiv = '<div id="cotrols' + id +'"></div>';
       $('#pdf' + id).append(controlsDiv);
       
       var prevButton = '<button id="pdf_prev_page' + id + '" style="margin: 10px;">Prev page</button>';
       var nextButton = '<button id="pdf_next_page' + id + '" style="margin: 10px;">Next page</button>';
       var pageCounter = '<span style="margin: 10px;">Page: <span id="pdf_page_number' + id + '"></span> / <span id="pdf_page_count' + id + '"></span></span>'
       
       var inputGoTo = '<input type="text" id="pdf_go_to_page' + id + '"/>';
       var buttonGoTo = '<button id="pdf_go_to_page_button' + id + '">Go to page</button>';
       
       $('#cotrols' + id).append(prevButton);
       $('#cotrols' + id).append(pageCounter);
       $('#cotrols' + id).append(nextButton);
       $('#cotrols' + id).append(inputGoTo);
       $('#cotrols' + id).append(buttonGoTo);
       
       
       var canvasDiv = '<canvas id="pdf_canvas' + id + '" style="border:1px solid black"></canvas>'
       $('#pdf' + id).append(canvasDiv);       

    };
    
    if (this.sandbox.addr) {
        this.receiveData('api/link/content/?addr=' + this.sandbox.addr);
    }
};


SCWeb.core.ComponentManager.appendComponentInitialize(PdfComponent);
