export const formatIndianCurrency = (num) => {
    num = Math.round(num);
    const absNum = Math.abs(num);

    if (absNum >= 1e7) {
        return '₹ ' + (absNum / 1e7).toFixed(2) + ' Cr';
    } else if (absNum >= 1e5) {
        return '₹ ' + (absNum / 1e5).toFixed(2) + ' L';
    } else if (absNum >= 1e3) {
        return '₹ ' + (absNum / 1e3).toFixed(0) + ' K';
    }
    return '₹ ' + num.toLocaleString('en-IN');
};

export const formatIndianNumber = (num) => {
    if (!num && num !== 0) return '';
    const x = num.toString();
    const lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '')
        return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    return lastThree;
};

export const parseIndianNumber = (str) => {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/,/g, '')) || 0;
};

export const f_simple = (val) => `₹${Math.round(val).toLocaleString('en-IN')}`;
export const neg_f_simple = (val) => `-₹${Math.round(val).toLocaleString('en-IN')}`;

export const numberToWordsIndian = (num) => {
    num = Number(num) || 0;
    if (num === 0) return 'Zero';

    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function twoDigits(n) {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    }

    function threeDigits(n) {
        let str = '';
        if (n > 99) {
            str += a[Math.floor(n / 100)] + ' hundred';
            if (n % 100) str += ' ';
        }
        if (n % 100) str += twoDigits(n % 100);
        return str;
    }

    const crore = Math.floor(num / 10000000);
    num = num % 10000000;
    const lakh = Math.floor(num / 100000);
    num = num % 100000;
    const thousand = Math.floor(num / 1000);
    const hund = Math.floor((num % 1000));

    const parts = [];
    if (crore) parts.push(twoDigits(crore) + ' crore');
    if (lakh) parts.push(twoDigits(lakh) + ' lakh');
    if (thousand) parts.push(twoDigits(thousand) + ' thousand');
    if (hund) parts.push(threeDigits(hund));

    const words = parts.join(' ').replace(/\s+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
};
