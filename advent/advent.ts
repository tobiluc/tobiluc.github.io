interface GridOptions {
    year: number;
    month: string;
    numDays: number;
    containerSelector: string;
    permutation: number[];
}

class RevealGrid {
    private options: GridOptions;
  private container: HTMLElement | null;

  constructor(options: GridOptions) {
    this.options = options;
    this.container = document.querySelector(options.containerSelector);
    if (!this.container) {
      throw new Error(`Element ${options.containerSelector} not found.`);
    }
  }

  public init(): void {
    if (!this.container) {return;}

    this.container.innerHTML = '';

    for (let i = 1; i <= this.options.numDays; ++i)
    {
        const day = this.options.permutation[i-1];
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.id = day.toString();
      cell.innerText = day.toString();

      // Toggle reveal state on click
      cell.addEventListener('click', () => {
        this.revealIfAllowed(day);
      });
      this.container.appendChild(cell);
    }

    this.checkCache();
  }

    public getCell(dayId: number | string): HTMLElement | null {
        return this.container?.querySelector(`[data-id="${dayId}"]`) || null;
    }

    public revealIfAllowed(day: number): void {
        const cell = this.getCell(day);
        if (!cell) {return;}
        // Check Date (since this is for fun only, we don't make it secure)
        if (this.dayIsAllowed(day)) {
            cell.classList.add('revealed');
            this.addRevealedToCache(day);
        }
    }

    protected checkCache(): void {
        // Reveal previosuly revealed cells. Store revealed state as bit string
        const bitString = this.getRevealedCache();
        [...bitString].forEach((char:String, index:number) => {
            if (char != '0') {
                this.revealIfAllowed(index+1);
            }
        });
        localStorage.setItem('advent-revealed', bitString);
    }

    protected getRevealedCache(): string {
        return localStorage.getItem("advent-revealed") || '0'.repeat(this.options.numDays);
    }

    protected addRevealedToCache(day: number): void {
        let bitString = this.getRevealedCache();
        if (this.dayIsAllowed(day)) {
            bitString = bitString.substring(0, day-1) + '1' + bitString.substring(day);
        }
        localStorage.setItem('advent-revealed', bitString);
    }

    protected dayIsAllowed(day: number): boolean {
        const todayDate = new Date();
        const cellDate = new Date(`${this.options.month} ${day}, ${this.options.year}`);
        return cellDate <= todayDate;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const options = {
        year: 2026,
        month: 'September',
        numDays: 24,
        containerSelector: '.grid-container',
        permutation: [14, 3, 21, 8, 19, 2, 11, 24, 7, 16, 1, 13, 22, 5, 18, 10, 23, 6, 15, 4, 20, 9, 12, 17]
    };
    const grid = new RevealGrid(options);
    grid.init();
});
